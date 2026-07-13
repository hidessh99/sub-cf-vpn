package test

import (
	"testing"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/ipvalidator"
)

func TestExtractIP(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"1.1.1.1", "1.1.1.1"},
		{"1.1.1.1:443", "1.1.1.1"},
		{"[2001:db8::1]:8443", "2001:db8::1"},
		{"2001:db8::1", "2001:db8::1"},
		{"  192.168.1.100  ", "192.168.1.100"},
		{"invalid-ip", "invalid-ip"},
	}

	for _, tc := range tests {
		result := ipvalidator.ExtractIP(tc.input)
		if result != tc.expected {
			t.Errorf("ExtractIP(%q) = %q, expected %q", tc.input, result, tc.expected)
		}
	}
}

func TestIsPrivateIP(t *testing.T) {
	tests := []struct {
		input    string
		expected bool
	}{
		// Private IPv4 (RFC 1918)
		{"10.0.0.1", true},
		{"172.16.5.10", true},
		{"192.168.1.1", true},
		{"192.168.1.1:80", true},

		// Loopback and unspecified
		{"127.0.0.1", true},
		{"::1", true},
		{"0.0.0.0", true},

		// Link local
		{"169.254.1.1", true},
		{"fe80::1", true},

		// IPv6 Private (ULA)
		{"fc00::1", true},
		{"fdff::1", true},

		// Public IPs
		{"1.1.1.1", false},
		{"8.8.8.8", false},
		{"172.217.16.142", false},
		{"2606:4700:4700::1111", false},

		// Invalid IPs
		{"", true},
		{"invalid-ip", true},
	}

	for _, tc := range tests {
		result := ipvalidator.IsPrivateIP(tc.input)
		if result != tc.expected {
			t.Errorf("IsPrivateIP(%q) = %t, expected %t", tc.input, result, tc.expected)
		}
	}
}

func TestIsValidPublicIP(t *testing.T) {
	tests := []struct {
		input    string
		expected bool
	}{
		{"1.1.1.1", true},
		{"8.8.8.8:443", true},
		{"192.168.1.1", false},
		{"invalid-ip", false},
	}

	for _, tc := range tests {
		result := ipvalidator.IsValidPublicIP(tc.input)
		if result != tc.expected {
			t.Errorf("IsValidPublicIP(%q) = %t, expected %t", tc.input, result, tc.expected)
		}
	}
}
