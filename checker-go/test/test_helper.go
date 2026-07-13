package test

import (
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/config"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/logger"
	"github.com/sirupsen/logrus"
)

func testLogger() *logger.LogrusLogger {
	l := logrus.New()
	l.SetLevel(logrus.PanicLevel) // keeps tests silent
	return &logger.LogrusLogger{Logger: l}
}

func testConfig() *config.AppConfig {
	return &config.AppConfig{
		JWT: config.JWTConfig{
			Secret:    "test-jwt-secret-key-that-is-long-enough",
			ExpiresIn: "24h",
		},
	}
}

func ptrString(s string) *string {
	return &s
}

func ptrInt(i int) *int {
	return &i
}
