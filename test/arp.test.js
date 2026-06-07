import test from "node:test";
import assert from "node:assert/strict";
import { parseArpTable } from "../src/arp.js";

test("parseArpTable parses macOS arp output", () => {
  const devices = parseArpTable(`
? (192.168.86.1) at aa:bb:cc:dd:ee:ff on en0 ifscope [ethernet]
pi-kato.lan (192.168.86.41) at 11:22:33:44:55:66 on en0 ifscope [ethernet]
? (192.168.86.99) at incomplete on en0 ifscope [ethernet]
`);

  assert.deepEqual(devices, [
    { ip: "192.168.86.1", mac: "aa:bb:cc:dd:ee:ff", hostname: "", vendor: "Private MAC" },
    { ip: "192.168.86.41", mac: "11:22:33:44:55:66", hostname: "pi-kato.lan", vendor: "" },
  ]);
});

test("parseArpTable adds vendor for known local prefixes", () => {
  const devices = parseArpTable("? (192.168.86.38) at dc:a6:32:da:df:68 on en0 ifscope [ethernet]");

  assert.equal(devices[0].vendor, "Raspberry Pi Trading Ltd");
});
