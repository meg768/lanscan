import test from "node:test";
import assert from "node:assert/strict";
import { vendorForMac } from "../src/vendors.js";

test("vendorForMac normalizes short mac segments", () => {
  assert.equal(vendorForMac("2c:cf:67:81:d:88"), "Raspberry Pi (Trading) Ltd");
});

test("vendorForMac identifies newer Raspberry Pi prefixes", () => {
  assert.equal(vendorForMac("6c:19:8f:b4:e8:70"), "D-Link International");
});

test("vendorForMac returns empty string for unknown prefixes", () => {
  assert.equal(vendorForMac("11:22:33:44:55:66"), "");
});

test("vendorForMac identifies locally administered private mac addresses", () => {
  assert.equal(vendorForMac("3e:9e:64:d0:a4:1b"), "Private MAC");
  assert.equal(vendorForMac("a6:d2:31:e7:8a:1e"), "Private MAC");
});
