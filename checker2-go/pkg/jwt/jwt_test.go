package jwt

import (
	"testing"
	"time"
)

func TestParseDuration(t *testing.T) {
	tests := []struct {
		input    string
		expected time.Duration
		hasError bool
	}{
		{"24h", 24 * time.Hour, false},
		{"30m", 30 * time.Minute, false},
		{"1d", 24 * time.Hour, false},
		{"7d", 7 * 24 * time.Hour, false},
		{"", 24 * time.Hour, false},
		{"invalid", 0, true},
	}

	for _, tc := range tests {
		res, err := ParseDuration(tc.input)
		if tc.hasError {
			if err == nil {
				t.Errorf("ParseDuration(%q) expected error, got nil", tc.input)
			}
		} else {
			if err != nil {
				t.Errorf("ParseDuration(%q) returned unexpected error: %v", tc.input, err)
			}
			if res != tc.expected {
				t.Errorf("ParseDuration(%q) = %v, expected %v", tc.input, res, tc.expected)
			}
		}
	}
}

func TestJWTTokenSignAndVerify(t *testing.T) {
	secret := "my-super-secret-key-that-is-long-enough"
	claims := map[string]interface{}{
		"id":       123.0, // json numbers decode as float64
		"username": "admin",
	}

	token, err := SignToken(claims, secret, "1h")
	if err != nil {
		t.Fatalf("SignToken returned unexpected error: %v", err)
	}

	if token == "" {
		t.Fatal("SignToken returned empty token")
	}

	// Verify token
	parsedClaims, err := VerifyToken(token, secret)
	if err != nil {
		t.Fatalf("VerifyToken returned unexpected error: %v", err)
	}

	if parsedClaims == nil {
		t.Fatal("VerifyToken returned nil claims")
	}

	if parsedClaims["username"] != "admin" {
		t.Errorf("Expected username claim 'admin', got %v", parsedClaims["username"])
	}

	if parsedClaims["id"] != 123.0 {
		t.Errorf("Expected id claim 123.0, got %v", parsedClaims["id"])
	}

	// Verify token fails with wrong secret
	_, err = VerifyToken(token, "wrong-secret-key")
	if err == nil {
		t.Error("VerifyToken succeeded with incorrect secret key")
	}
}
