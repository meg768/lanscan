import test from "node:test";
import assert from "node:assert/strict";
import { cidrHosts, numberToIp, ipToNumber, subnetForAddress } from "../src/network.js";

test("ip conversion round trips", () => {
  assert.equal(numberToIp(ipToNumber("192.168.86.41")), "192.168.86.41");
});

test("cidrHosts returns usable hosts", () => {
  assert.deepEqual(cidrHosts("192.168.86.0/30"), ["192.168.86.1", "192.168.86.2"]);
});

test("subnetForAddress defaults to slash 24", () => {
  assert.equal(subnetForAddress("192.168.86.247"), "192.168.86.0/24");
});
