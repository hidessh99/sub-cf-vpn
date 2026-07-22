package port

type Logger interface {
	Debug(msg string, context string)
	Info(msg string, context string)
	Warn(msg string, context string)
	Error(msg string, err error, context string)
}
