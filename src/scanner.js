import os from "node:os";
import { parseArpTable } from "./arp.js";
import { createCommandRunner } from "./commands.js";
import { cidrHosts, subnetForAddress } from "./network.js";

export function createScanner({ run = createCommandRunner() } = {}) {
  return {
    async scan(options = {}) {
      const interfaceName = options.interfaceName || await defaultInterface(run);
      const localIp = await interfaceAddress(run, interfaceName);
      const subnet = options.subnet || subnetForAddress(localIp);
      const hosts = cidrHosts(subnet);

      if (options.shouldPing !== false) {
        await pingHosts(run, hosts, {
          concurrency: options.concurrency ?? 64,
          timeoutMs: options.timeoutMs ?? 250,
        });
      }

      const arpOutput = await readArpTable(run);
      const devices = parseArpTable(arpOutput).filter((device) => hosts.includes(device.ip));

      if (options.resolveNames !== false) {
        await resolveDeviceNames(run, devices, {
          concurrency: Math.min(options.concurrency ?? 64, 32),
          timeoutMs: 750,
        });
      }

      return {
        interface: interfaceName,
        localIp,
        subnet,
        scannedAt: new Date().toISOString(),
        platform: os.platform(),
        devices,
      };
    },
  };
}

async function defaultInterface(run) {
  const output = await run("route", ["get", "default"]);
  const match = /^\s*interface:\s*(\S+)/m.exec(output);
  if (!match) {
    throw new Error("Could not determine default network interface");
  }
  return match[1];
}

async function interfaceAddress(run, interfaceName) {
  const output = await run("ipconfig", ["getifaddr", interfaceName]);
  const address = output.trim();
  if (!address) {
    throw new Error(`Could not determine IPv4 address for interface ${interfaceName}`);
  }
  return address;
}

async function pingHosts(run, hosts, options) {
  let index = 0;
  const workers = Array.from({ length: Math.min(options.concurrency, hosts.length) }, async () => {
    while (index < hosts.length) {
      const host = hosts[index];
      index += 1;
      await pingHost(run, host, options.timeoutMs);
    }
  });
  await Promise.all(workers);
}

async function pingHost(run, host, timeoutMs) {
  try {
    await run("ping", ["-c", "1", "-W", String(timeoutMs), host], {
      timeoutMs: timeoutMs + 1000,
      maxBuffer: 16 * 1024,
    });
  } catch {
    // A failed ping can still populate useful ARP state; keep scanning.
  }
}

async function readArpTable(run) {
  return run("arp", ["-an"], { timeoutMs: 15000 });
}

async function resolveDeviceNames(run, devices, options) {
  let index = 0;
  const workers = Array.from({ length: Math.min(options.concurrency, devices.length) }, async () => {
    while (index < devices.length) {
      const device = devices[index];
      index += 1;
      device.name = await lookupDeviceName(run, device.ip, options.timeoutMs);
      device.hostname = device.name;
    }
  });
  await Promise.all(workers);
}

async function lookupDeviceName(run, ip, timeoutMs) {
  try {
    const output = await run("dscacheutil", ["-q", "host", "-a", "ip_address", ip], {
      timeoutMs,
      maxBuffer: 16 * 1024,
    });
    return parseDscacheName(output);
  } catch {
    return "";
  }
}

export function parseDscacheName(output) {
  const match = /^name:\s*(\S+)/m.exec(output);
  return match ? match[1].replace(/\.$/, "") : "";
}
