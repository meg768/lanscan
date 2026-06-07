import test from "node:test";
import assert from "node:assert/strict";
import { parseDscacheName } from "../src/scanner.js";

test("parseDscacheName reads the first returned name", () => {
  const name = parseDscacheName(`
name: pi-kato.lan
alias: 41.86.168.192.in-addr.arpa
ip_address: 192.168.86.41
`);

  assert.equal(name, "pi-kato.lan");
});

test("parseDscacheName returns empty string when no name is present", () => {
  assert.equal(parseDscacheName(""), "");
});
