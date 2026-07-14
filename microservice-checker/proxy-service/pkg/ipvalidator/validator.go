package ipvalidator

import (
	"net"
	"strings"
)

func ExtractIP(input string) string {
	clean := strings.TrimSpace(input)

	// Handle [IPv6] brackets (e.g. [::1]:8443)
	if strings.HasPrefix(clean, "[") && strings.Contains(clean, "]") {
		end := strings.Index(clean, "]")
		return clean[1:end]
	}

	// Try checking if it's directly a valid IP
	if net.ParseIP(clean) != nil {
		return clean
	}

	// If contains colons (IPv4 with port or IPv6 with port without brackets)
	if strings.Contains(clean, ":") {
		lastColon := strings.LastIndex(clean, ":")
		ipPart := clean[:lastColon]
		if net.ParseIP(ipPart) != nil {
			return ipPart
		}
	}

	return clean
}

func IsPrivateIP(ipStr string) bool {
	extracted := ExtractIP(ipStr)
	if extracted == "" {
		return true
	}

	ip := net.ParseIP(extracted)
	if ip == nil {
		return true
	}

	// Loopback / Unspecified
	if ip.IsLoopback() || ip.IsUnspecified() {
		return true
	}

	// Link-local
	if ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() {
		return true
	}

	// IPv4 Private Ranges
	if ip4 := ip.To4(); ip4 != nil {
		// 10.0.0.0/8
		if ip4[0] == 10 {
			return true
		}
		// 172.16.0.0/12
		if ip4[0] == 172 && ip4[1] >= 16 && ip4[1] <= 31 {
			return true
		}
		// 192.168.0.0/16
		if ip4[0] == 192 && ip4[1] == 168 {
			return true
		}
		// 127.0.0.0/8 (handled by IsLoopback but to be safe)
		if ip4[0] == 127 {
			return true
		}
		// 0.0.0.0/8 (Broadcast/any)
		if ip4[0] == 0 {
			return true
		}
		return false
	}

	// IPv6 Private Ranges (ULA fc00::/7)
	if len(ip) == 16 {
		// fc00::/7 has prefix fc or fd
		if ip[0] == 0xfc || ip[0] == 0xfd {
			return true
		}
	}

	return false
}

func IsValidPublicIP(ipStr string) bool {
	extracted := ExtractIP(ipStr)
	if net.ParseIP(extracted) == nil {
		return false
	}
	return !IsPrivateIP(extracted)
}
