import { readFileSync } from "node:fs";

const VENDORS = readVendorData("../data/vendors.json");

export function vendorForMac(mac) {
  const prefix = macPrefix(mac);
  return VENDORS.get(prefix) || privateMacVendor(mac);
}

function privateMacVendor(mac) {
  return isLocallyAdministeredMac(mac) ? "Private MAC" : "";
}

function isLocallyAdministeredMac(mac) {
  const firstByte = Number.parseInt(mac.split(":")[0], 16);
  return Number.isInteger(firstByte) && (firstByte & 0x02) === 0x02;
}

function readVendorData(path) {
  try {
    const json = readFileSync(new URL(path, import.meta.url), "utf8");
    return new Map(Object.entries(JSON.parse(json)));
  } catch {
    return new Map();
  }
}

function macPrefix(mac) {
  return mac
    .toLowerCase()
    .split(":")
    .slice(0, 3)
    .map((part) => part.padStart(2, "0"))
    .join(":");
}
