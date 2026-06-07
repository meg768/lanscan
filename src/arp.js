import { compareIp } from "./network.js";
import { vendorForMac } from "./vendors.js";

export function parseArpTable(output, options = {}) {
  const devices = [];
  for (const line of output.split("\n")) {
    const match = /^(?<host>\S+)\s+\((?<ip>\d+\.\d+\.\d+\.\d+)\)\s+at\s+(?<mac>[0-9a-f:]+|incomplete)/i.exec(line.trim());
    if (!match || match.groups.mac.toLowerCase() === "incomplete") {
      continue;
    }
    devices.push({
      ip: match.groups.ip,
      mac: normalizeMac(match.groups.mac),
      hostname: normalizeHostname(match.groups.host),
      vendor: vendorForMac(match.groups.mac, options),
    });
  }

  const byIp = new Map();
  for (const device of devices) {
    byIp.set(device.ip, device);
  }
  return [...byIp.values()].sort((a, b) => compareIp(a.ip, b.ip));
}

function normalizeHostname(hostname) {
  if (!hostname || hostname === "?") {
    return "";
  }
  return hostname.replace(/\.$/, "");
}

function normalizeMac(mac) {
  return mac.toLowerCase();
}
