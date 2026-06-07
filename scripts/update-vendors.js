#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";

const SOURCE_URL = "https://standards-oui.ieee.org/oui/oui.csv";
const OUTPUT_PATH = new URL("../data/vendors.json", import.meta.url);

const response = await fetch(SOURCE_URL);
if (!response.ok) {
  throw new Error(`Failed to fetch IEEE OUI data: ${response.status} ${response.statusText}`);
}

const csv = await response.text();
const vendors = parseVendors(csv);
const sorted = Object.fromEntries([...vendors.entries()].sort(([a], [b]) => a.localeCompare(b)));

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(sorted, null, 2)}\n`);

console.log(`Wrote ${vendors.size} vendors to ${OUTPUT_PATH.pathname}`);

function parseVendors(csvText) {
  const vendorsByPrefix = new Map();
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  for (const line of lines.slice(1)) {
    const fields = parseCsvLine(line);
    const assignment = fields[1]?.trim();
    const vendor = normalizeVendorName(fields[2] || "");
    if (!assignment || !vendor) {
      continue;
    }
    vendorsByPrefix.set(normalizeAssignment(assignment), vendor);
  }
  return vendorsByPrefix;
}

function normalizeAssignment(assignment) {
  return assignment
    .toLowerCase()
    .replace(/[^0-9a-f]/g, "")
    .match(/.{1,2}/g)
    .join(":");
}

function normalizeVendorName(vendor) {
  return vendor.trim().replace(/\s+/g, " ");
}

function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += char;
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      fields.push(field);
      field = "";
    } else {
      field += char;
    }
  }

  fields.push(field);
  return fields;
}
