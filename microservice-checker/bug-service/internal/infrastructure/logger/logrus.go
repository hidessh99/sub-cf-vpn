package logger

import (
	"os"

	"github.com/hidessh99/sub-cf-vpn/microservice-checker/bug-service/internal/shared/port"
	"github.com/sirupsen/logrus"
)

type LogrusLogger struct {
	*logrus.Logger
}

// Ensure LogrusLogger implements port.Logger
var _ port.Logger = (*LogrusLogger)(nil)

func InitLogger() *LogrusLogger {
	log := logrus.New()

	// Use JSONFormatter in production
	isProd := os.Getenv("NODE_ENV") == "production"
	if isProd {
		log.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: "2006-01-02T15:04:05.000Z07:00",
		})
	} else {
		log.SetFormatter(&logrus.TextFormatter{
			FullTimestamp:   true,
			TimestampFormat: "2006-01-02 15:04:05",
			ForceColors:     true,
		})
	}

	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel != "" {
		if level, err := logrus.ParseLevel(logLevel); err == nil {
			log.SetLevel(level)
		}
	} else {
		log.SetLevel(logrus.InfoLevel)
	}

	log.SetOutput(os.Stdout)

	return &LogrusLogger{log}
}

func (l *LogrusLogger) Debug(message string, context string) {
	l.WithField("context", context).Debug(message)
}

func (l *LogrusLogger) Info(message string, context string) {
	l.WithField("context", context).Info(message)
}

func (l *LogrusLogger) Warn(message string, context string) {
	l.WithField("context", context).Warn(message)
}

func (l *LogrusLogger) Error(message string, err error, context string) {
	entry := l.WithField("context", context)
	if err != nil {
		entry = entry.WithError(err)
	}
	entry.Error(message)
}
