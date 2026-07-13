package apperror

import "net/http"

type AppError struct {
	Message    string `json:"message"`
	StatusCode int    `json:"-"`
}

func (e *AppError) Error() string {
	return e.Message
}

func NewAppError(message string, statusCode int) *AppError {
	return &AppError{
		Message:    message,
		StatusCode: statusCode,
	}
}

func NewNotFoundError(message string) *AppError {
	if message == "" {
		message = "Resource not found"
	}
	return NewAppError(message, http.StatusNotFound)
}

func NewValidationError(message string) *AppError {
	if message == "" {
		message = "Validation failed"
	}
	return NewAppError(message, http.StatusBadRequest)
}

func NewUnauthorizedError(message string) *AppError {
	if message == "" {
		message = "Unauthorized"
	}
	return NewAppError(message, http.StatusUnauthorized)
}

func NewForbiddenError(message string) *AppError {
	if message == "" {
		message = "Forbidden"
	}
	return NewAppError(message, http.StatusForbidden)
}
