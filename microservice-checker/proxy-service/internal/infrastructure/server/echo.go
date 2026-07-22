package server

import (
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/infrastructure/config"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/shared/dto"
	custommiddleware "github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/shared/middleware"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/shared/port"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/pkg/apperror"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/gorm"
)

type CustomValidator struct {
	Validator *validator.Validate
}

func (cv *CustomValidator) Validate(i interface{}) error {
	if err := cv.Validator.Struct(i); err != nil {
		return err
	}
	return nil
}

func fmtValidationErrorMessage(err validator.FieldError) string {
	field := err.Field()
	switch err.Tag() {
	case "required":
		return field + " is required"
	case "min":
		return field + " must be at least " + err.Param() + " characters long"
	default:
		return field + " validation failed on '" + err.Tag() + "'"
	}
}

func NewEcho(cfg *config.AppConfig, log port.Logger) *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	e.Validator = &CustomValidator{Validator: validator.New()}

	e.HTTPErrorHandler = func(err error, ctx echo.Context) {
		if ctx.Response().Committed {
			return
		}

		code := http.StatusInternalServerError
		var message string
		var validationErrors []string

		var appErr *apperror.AppError
		var httpErr *echo.HTTPError
		var valErr validator.ValidationErrors

		if errors.As(err, &appErr) {
			code = appErr.StatusCode
			message = appErr.Message
		} else if errors.As(err, &httpErr) {
			code = httpErr.Code
			if msgStr, ok := httpErr.Message.(string); ok {
				message = msgStr
			} else {
				message = "HTTP error"
			}
		} else if errors.As(err, &valErr) {
			code = http.StatusBadRequest
			var errMsgs []string
			for _, ve := range valErr {
				errMsgs = append(errMsgs, fmtValidationErrorMessage(ve))
			}
			message = strings.Join(errMsgs, ", ")
			validationErrors = errMsgs
		} else {
			log.Error("Unexpected error occurred: ", err, "Router")
			if os.Getenv("NODE_ENV") == "production" {
				message = "Internal Server Error"
			} else {
				message = err.Error()
			}
		}

		resp := dto.APIResponse{
			Success: false,
			Message: message,
			Errors:  validationErrors,
			Error:   nil,
		}

		_ = ctx.JSON(code, resp)
	}

	e.Use(middleware.RequestID())
	e.Use(middleware.ContextTimeout(30 * time.Second))
	e.Use(middleware.Gzip())
	e.Use(custommiddleware.RequestLogger(log))
	e.Use(custommiddleware.SecurityHeaders())
	e.Use(middleware.Recover())

	return e
}

func GetAdminCORS(cfg *config.AppConfig) echo.MiddlewareFunc {
	adminOriginsStr := os.Getenv("ADMIN_ALLOWED_ORIGINS")
	adminOrigins := cfg.AllowedOrigins
	if len(adminOrigins) == 0 {
		adminOrigins = []string{"http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"}
	}
	if adminOriginsStr != "" {
		adminOrigins = nil
		for _, o := range strings.Split(adminOriginsStr, ",") {
			adminOrigins = append(adminOrigins, strings.TrimSpace(o))
		}
	}

	return middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOriginFunc: func(origin string) (bool, error) {
			for _, o := range adminOrigins {
				if o == origin {
					return true, nil
				}
			}
			return false, nil
		},
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders:     []string{echo.HeaderContentType, echo.HeaderAuthorization},
		MaxAge:           86400,
		AllowCredentials: true,
	})
}

func GetPublicCORS() echo.MiddlewareFunc {
	return middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderContentType},
		MaxAge:       86400,
	})
}

type healthCheckResponse struct {
	Status  string            `json:"status"`
	Service string            `json:"service"`
	Runtime string            `json:"runtime"`
	Details map[string]string `json:"details"`
}

func RegisterSystemRoutes(e *echo.Echo, db *gorm.DB, log port.Logger) {
	healthCheck := func(c echo.Context) error {
		dbStatus := "ok"
		sqlDB, err := db.DB()
		if err == nil {
			if err = sqlDB.Ping(); err != nil {
				dbStatus = "error"
				log.Error("Health check failed - database ping failed", err, "SystemHandler")
			}
		} else {
			dbStatus = "error"
			log.Error("Health check failed - generic database DB connection failed", err, "SystemHandler")
		}

		overallStatus := "ok"
		statusCode := http.StatusOK
		if dbStatus != "ok" {
			overallStatus = "degraded"
			statusCode = http.StatusServiceUnavailable
		}

		return c.JSON(statusCode, healthCheckResponse{
			Status:  overallStatus,
			Service: "lufeng-vpn-checker",
			Runtime: "go",
			Details: map[string]string{
				"database": dbStatus,
			},
		})
	}

	publicCORS := GetPublicCORS()
	e.GET("/", healthCheck)
	e.GET("/health", healthCheck, publicCORS)
}
