#!/usr/bin/env node

import process from "node:process";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { createScanner } from "./src/scanner.js";

const argv = await yargs(hideBin(process.argv))
  .scriptName("lanscan")
  .usage("$0 [options]")
  .wrap(null)
  .option("interface", {
    alias: "i",
    describe: "Network interface to scan",
    type: "string",
  })
  .option("subnet", {
    alias: "s",
    describe: "IPv4 subnet to scan, for example 192.168.86.0/24",
    type: "string",
  })
  .option("timeout", {
    alias: "t",
    describe: "Ping timeout in milliseconds",
    default: 250,
    type: "number",
  })
  .option("concurrency", {
    alias: "c",
    describe: "Number of parallel pings",
    default: 64,
    type: "number",
  })
  .option("ping", {
    describe: "Ping hosts before reading the ARP table",
    default: true,
    type: "boolean",
  })
  .option("json", {
    describe: "Output JSON",
    default: false,
    type: "boolean",
  })
  .option("names", {
    describe: "Resolve device names with dscacheutil",
    default: true,
    type: "boolean",
  })
  .option("name", {
    alias: "n",
    describe: "Only show devices whose name contains this text",
    type: "string",
  })
  .option("vendor", {
    alias: "v",
    describe: "Only show devices whose vendor contains this text",
    type: "string",
  })
  .strict()
  .help()
  .parse();

try {
  const scanner = createScanner();
  const result = await scanner.scan({
    interfaceName: argv.interface,
    subnet: argv.subnet,
    timeoutMs: argv.timeout,
    concurrency: argv.concurrency,
    shouldPing: argv.ping,
    resolveNames: argv.names !== false,
  });

  const devices = filterDevices(result.devices, { name: argv.name, vendor: argv.vendor });
  const output = { ...result, devices };

  if (argv.json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    printTable(devices);
    console.log(`\nFound ${devices.length} device${devices.length === 1 ? "" : "s"} on ${result.subnet} via ${result.interface}`);
  }
} catch (error) {
  console.error(`lanscan: ${error.message}`);
  process.exitCode = 1;
}

function filterDevices(devices, filters) {
  let filtered = devices;

  if (filters.name) {
    const query = filters.name.toLowerCase();
    filtered = filtered.filter((device) => (device.name || device.hostname || "").toLowerCase().includes(query));
  }

  if (filters.vendor) {
    const query = filters.vendor.toLowerCase();
    filtered = filtered.filter((device) => (device.vendor || "").toLowerCase().includes(query));
  }

  return filtered;
}

function printTable(devices, options = {}) {
  if (!devices.length) {
    console.log("No devices found.");
    return;
  }

  const rows = devices.map((device) => ({
    ip: device.ip,
    mac: device.mac || "-",
    name: device.name || device.hostname || "-",
    vendor: device.vendor || "-",
  }));
  const widths = {
    ip: Math.max(2, ...rows.map((row) => row.ip.length)),
    mac: Math.max(3, ...rows.map((row) => row.mac.length)),
    name: Math.max(4, ...rows.map((row) => row.name.length)),
    vendor: Math.max(6, ...rows.map((row) => row.vendor.length)),
  };

  console.log(`${pad("IP", widths.ip)}  ${pad("MAC", widths.mac)}  ${pad("Name", widths.name)}  ${pad("Vendor", widths.vendor)}`);
  console.log(`${"-".repeat(widths.ip)}  ${"-".repeat(widths.mac)}  ${"-".repeat(widths.name)}  ${"-".repeat(widths.vendor)}`);
  for (const row of rows) {
    console.log(`${pad(row.ip, widths.ip)}  ${pad(row.mac, widths.mac)}  ${pad(row.name, widths.name)}  ${pad(row.vendor, widths.vendor)}`);
  }
}

function pad(value, width) {
  return value.padEnd(width, " ");
}
