import * as net from "node:net";

/**
 * Extracts the raw IP address string from potential IP:port, [IPv6]:port, or pure IP format.
 */
export function extractIP(input: string): string {
  const clean = input.trim();
  
  // Handle brackets [IPv6] (e.g. [::1]:8443)
  if (clean.startsWith("[") && clean.includes("]")) {
    const end = clean.indexOf("]");
    return clean.substring(1, end);
  }
  
  // If it's directly a valid IP
  if (net.isIP(clean) !== 0) {
    return clean;
  }
  
  // If it contains colons (could be IPv4 with port or IPv6 with port without brackets)
  if (clean.includes(":")) {
    const lastColon = clean.lastIndexOf(":");
    const ipPart = clean.substring(0, lastColon);
    if (net.isIP(ipPart) !== 0) {
      return ipPart;
    }
  }
  
  return clean;
}

/**
 * Parses an IPv4 address string into a 32-bit unsigned integer.
 * Returns null if the address is not a valid IPv4 address.
 */
function parseIPv4(ip: string): number | null {
  if (net.isIPv4(ip) !== true) return null;
  const parts = ip.split(".").map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(isNaN)) return null;
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

/**
 * Checks if a given IP address is private, loopback, or link-local.
 * Supports both IPv4 and IPv6, including IPv4-mapped IPv6 addresses.
 * Automatically extracts IP if a port is attached.
 */
export function isPrivateIP(ip: string): boolean {
  const extracted = extractIP(ip);
  const cleanIp = extracted.toLowerCase();
  
  if (!cleanIp) return true;

  // Check if it's IPv4
  if (net.isIPv4(cleanIp)) {
    const ipNum = parseIPv4(cleanIp);
    if (ipNum === null) return true;

    // 127.0.0.0/8 (Loopback)
    if ((ipNum & 0xff000000) === 0x7f000000) return true;
    
    // 10.0.0.0/8 (Private RFC 1918)
    if ((ipNum & 0xff000000) === 0x0a000000) return true;
    
    // 172.16.0.0/12 (Private RFC 1918)
    // 172.16.0.0 - 172.31.255.255
    const firstOctet = (ipNum >>> 24) & 0xff;
    const secondOctet = (ipNum >>> 16) & 0xff;
    if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
    
    // 192.168.0.0/16 (Private RFC 1918)
    if ((ipNum & 0xffff0000) === 0xc0a80000) return true;
    
    // 169.254.0.0/16 (Link-local)
    if ((ipNum & 0xffff0000) === 0xa9fe0000) return true;

    // 0.0.0.0/8 (Broadcast/any)
    if ((ipNum & 0xff000000) === 0) return true;

    return false;
  }

  // Check if it's IPv6
  if (net.isIPv6(cleanIp)) {
    // Loopback ::1
    if (cleanIp === "::1" || cleanIp === "0:0:0:0:0:0:0:1") return true;
    
    // Unspecified ::
    if (cleanIp === "::" || cleanIp === "0:0:0:0:0:0:0:0") return true;

    // IPv4-mapped IPv6 (::ffff:192.168.1.1)
    if (cleanIp.startsWith("::ffff:")) {
      const ipv4Part = cleanIp.substring(7);
      if (net.isIPv4(ipv4Part)) {
        return isPrivateIP(ipv4Part);
      }
    }

    // Unique Local Address (ULA) fc00::/7 (ranges from fc00:: to fdff::)
    if (cleanIp.startsWith("fc") || cleanIp.startsWith("fd")) {
      return true;
    }

    // Link-local address fe80::/10 (ranges from fe80:: to febf::)
    if (cleanIp.startsWith("fe8") || cleanIp.startsWith("fe9") || cleanIp.startsWith("fea") || cleanIp.startsWith("feb")) {
      return true;
    }

    return false;
  }

  // Not a valid IP address
  return true;
}

/**
 * Validates that the input is a valid public IP address (IPv4 or IPv6).
 * Automatically extracts IP if a port is attached.
 */
export function isValidPublicIP(ip: string): boolean {
  const extracted = extractIP(ip);
  if (net.isIP(extracted) === 0) return false;
  return !isPrivateIP(extracted);
}
