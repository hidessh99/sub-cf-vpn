package test

import (
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/infrastructure/config"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/shared/port"
)

type dummyLogger struct{}

func (d dummyLogger) Debug(msg string, ctx string)             {}
func (d dummyLogger) Info(msg string, ctx string)              {}
func (d dummyLogger) Warn(msg string, ctx string)              {}
func (d dummyLogger) Error(msg string, err error, ctx string) {}

func testLogger() port.Logger {
	return dummyLogger{}
}

func testConfig() *config.AppConfig {
	return &config.AppConfig{
		JWT: config.JWTConfig{
			Secret:    "test-jwt-secret-key-that-is-long-enough",
			ExpiresIn: "24h",
		},
	}
}
