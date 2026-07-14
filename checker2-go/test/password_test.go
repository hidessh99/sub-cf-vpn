package test

import (
	"testing"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/pkg/password"
)

func TestPasswordHashing(t *testing.T) {
	pass := "my-secure-password"

	hash, err := password.HashPassword(pass)
	if err != nil {
		t.Fatalf("HashPassword returned unexpected error: %v", err)
	}

	if hash == "" {
		t.Fatal("HashPassword returned empty hash")
	}

	if hash == pass {
		t.Fatal("HashPassword returned plaintext password as hash")
	}

	// Verify correct password matches
	err = password.VerifyPassword(pass, hash)
	if err != nil {
		t.Errorf("VerifyPassword failed to match correct password: %v", err)
	}

	// Verify incorrect password fails
	err = password.VerifyPassword("wrong-password", hash)
	if err == nil {
		t.Error("VerifyPassword verified incorrect password successfully")
	}
}
