export function ipToNumber(ip) {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }
  return parts.reduce((total, part) => (total << 8) + part, 0) >>> 0;
}

export function numberToIp(number) {
  return [
    (number >>> 24) & 255,
    (number >>> 16) & 255,
    (number >>> 8) & 255,
    number & 255,
  ].join(".");
}

export function cidrHosts(cidr) {
  const match = /^(\d+\.\d+\.\d+\.\d+)\/(\d{1,2})$/.exec(cidr);
  if (!match) {
    throw new Error(`Invalid CIDR subnet: ${cidr}`);
  }

  const base = ipToNumber(match[1]);
  const prefix = Number(match[2]);
  if (!Number.isInteger(prefix) || prefix < 1 || prefix > 30) {
    throw new Error(`Unsupported CIDR prefix: ${prefix}`);
  }

  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  const network = (base & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const hosts = [];
  for (let current = network + 1; current < broadcast; current += 1) {
    hosts.push(numberToIp(current));
  }
  return hosts;
}

export function subnetForAddress(ip) {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

export function compareIp(a, b) {
  return ipToNumber(a) - ipToNumber(b);
}
