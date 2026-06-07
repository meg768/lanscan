# lanscan

`lanscan` is a small Node.js CLI for listing devices on your local network from macOS.

It uses built-in macOS command line tools (`route`, `ipconfig`, `ping`, `arp`, and `dscacheutil`). It does not require `nmap`, `arp-scan`, Homebrew packages, or elevated privileges.

## Install

```sh
npm install
```

For local development:

```sh
npm start
```

For command-line use from anywhere on the Mac:

```sh
npm install -g .
lanscan
```

## What It Does

`lanscan` determines the default macOS network interface, derives the local `/24` IPv4 subnet, pings the subnet to populate the ARP table, reads devices from `arp`, and resolves names with `dscacheutil`.

By default it prints a table with:

- `IP`
- `MAC`
- `Name`
- `Vendor`

Vendor lookup uses a bundled JSON file generated from the IEEE MA-L public listing.

Name lookup is enabled by default. Use `--no-names` for the fastest output.

## Examples

Scan the default network:

```sh
lanscan
```

Scan a specific subnet:

```sh
lanscan --subnet 192.168.86.0/24
```

Print JSON:

```sh
lanscan --json
```

Skip name lookups:

```sh
lanscan --no-names
```

Show the current ARP table without pinging the network first:

```sh
lanscan --no-ping
```

Only show devices with names containing `pi-`:

```sh
lanscan --name pi-
```

Only show devices with vendors containing `raspberry`:

```sh
lanscan --vendor raspberry
```

Combine filters and JSON:

```sh
lanscan --name pi- --vendor raspberry --json
```

## Options

```text
--interface, -i    Network interface to scan. Defaults to the macOS default route interface.
--subnet, -s       IPv4 subnet to scan. Defaults to the interface address as /24.
--timeout, -t      Ping timeout in milliseconds. Default: 250.
--concurrency, -c  Number of parallel pings. Default: 64.
--json             Output JSON instead of a table.
--names            Resolve device names. Enabled by default; use --no-names to disable.
--name, -n         Only show devices whose name contains this text.
--vendor, -v       Only show devices whose vendor contains this text.
--no-ping          Do not ping first; only read the current ARP table.
```

## JSON Output

```json
{
  "interface": "en0",
  "localIp": "192.168.86.247",
  "subnet": "192.168.86.0/24",
  "scannedAt": "2026-06-07T19:00:00.000Z",
  "platform": "darwin",
  "devices": [
    {
      "ip": "192.168.86.41",
      "mac": "2c:cf:67:81:d:88",
      "vendor": "Raspberry Pi (Trading) Ltd",
      "hostname": "pi-kato.lan",
      "name": "pi-kato.lan"
    }
  ]
}
```

## Notes

This is intentionally macOS-focused. It shells out to macOS networking tools instead of using external scanners.

ARP-based discovery only finds devices that are visible on the local link and present in the ARP table after the scan. Some devices may ignore ping or may not have a resolvable name.

Vendor is based on the MAC address prefix. It identifies the network hardware vendor, which is not always the same as the product brand.

Update the bundled vendor JSON from IEEE:

```sh
npm run update-vendors
```

The default subnet assumption is `/24`. Use `--subnet` if your network is different.

## Development

```sh
npm test
node ./lanscan.js --help
node ./lanscan.js --no-ping
```
