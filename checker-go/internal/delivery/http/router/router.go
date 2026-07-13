package router

import (
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/delivery/http/dto"
	custommiddleware "github.com/hidessh99/sub-cf-vpn/checker-go/internal/delivery/http/middleware"
	customvalidator "github.com/hidessh99/sub-cf-vpn/checker-go/internal/delivery/http/validator"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/container"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/apperror"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func SetupRouter(e *echo.Echo, c *container.Container) {
	// Register validator
	e.Validator = customvalidator.NewCustomValidator()

	// Central HTTP Error Handler
	e.HTTPErrorHandler = func(err error, ctx echo.Context) {
		if ctx.Response().Committed {
			return
		}

		code := http.StatusInternalServerError
		message := "Internal Server Error"
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
			message = "Validation failed"
			for _, ve := range valErr {
				validationErrors = append(validationErrors, fmtValidationErrorMessage(ve))
			}
		} else {
			c.Logger.Error("Unexpected error occurred: ", err, "Router")
			message = err.Error()
		}

		resp := dto.APIResponse{
			Success: false,
			Message: message,
			Errors:  validationErrors,
			Error:   nil,
		}

		_ = ctx.JSON(code, resp)
	}

	// 1. Global Middlewares
	e.Use(middleware.RequestID())
	e.Use(middleware.Gzip())
	e.Use(custommiddleware.RequestLogger(c.Logger))
	e.Use(custommiddleware.SecurityHeaders())
	e.Use(middleware.Recover())

	// Configure Admin CORS allowed origins
	adminOriginsStr := os.Getenv("ADMIN_ALLOWED_ORIGINS")
	adminOrigins := []string{"http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"}
	if adminOriginsStr != "" {
		adminOrigins = nil
		for _, o := range strings.Split(adminOriginsStr, ",") {
			adminOrigins = append(adminOrigins, strings.TrimSpace(o))
		}
	}

	// Dynamic CORS config helper for admin routes
	adminCORS := middleware.CORSWithConfig(middleware.CORSConfig{
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

	// Public CORS config (Wildcard allowed)
	publicCORS := middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderContentType},
		MaxAge:       86400,
	})

	// 2. Public Routes
	e.GET("/", c.SystemHandler.HealthCheck)
	e.GET("/health", c.SystemHandler.HealthCheck, publicCORS)

	// Auth Group
	authGroup := e.Group("/api/v1/auth")
	authGroup.Use(adminCORS)
	authGroup.POST("/login", c.AuthHandler.Login, custommiddleware.LoginRateLimiter.Limit())
	authGroup.GET("/me", c.AuthHandler.GetProfile, custommiddleware.RequireAuth(c.Config))
	authGroup.PUT("/password", c.AuthHandler.ChangePassword, custommiddleware.RequireAuth(c.Config))

	// Admin API Protected Routes
	adminGroup := e.Group("/api/v1")
	adminGroup.Use(adminCORS)
	adminGroup.Use(custommiddleware.RequireAuth(c.Config))

	// Proxies Admin
	adminGroup.GET("/proxies", c.ProxyHandler.GetProxies)
	adminGroup.POST("/proxies", c.ProxyHandler.CreateProxy)
	adminGroup.PUT("/proxies/:id", c.ProxyHandler.UpdateProxy)
	adminGroup.DELETE("/proxies/:id", c.ProxyHandler.DeleteProxy)
	adminGroup.POST("/proxies/import", c.ProxyHandler.ImportProxies)
	adminGroup.POST("/proxies/sync-health", c.ProxyHandler.SyncHealth)
	adminGroup.GET("/proxies/geoip", c.ProxyHandler.GeoIPLookup)

	// Domains Admin
	adminGroup.GET("/domains", c.DomainHandler.GetDomains)
	adminGroup.POST("/domains", c.DomainHandler.CreateDomain)
	adminGroup.DELETE("/domains/:id", c.DomainHandler.DeleteDomain)
	adminGroup.POST("/domains/import", c.DomainHandler.ImportDomains)

	// Bugs Admin
	adminGroup.GET("/bugs", c.BugHandler.GetBugs)
	adminGroup.POST("/bugs", c.BugHandler.CreateBug)
	adminGroup.DELETE("/bugs/:id", c.BugHandler.DeleteBug)
	adminGroup.POST("/bugs/import", c.BugHandler.ImportBugs)

	// Dashboard Admin
	adminGroup.GET("/dashboard/stats", c.DashboardHandler.GetStats)

	// 3. Public API Group (Kompatibel dengan config static JSON)
	publicAPIGroup := e.Group("/api/v1/public")
	publicAPIGroup.Use(publicCORS)
	publicAPIGroup.GET("/proxies", c.ProxyHandler.GetPublicProxies)
	publicAPIGroup.GET("/proxies/grouped", c.ProxyHandler.GetPublicProxiesGrouped)
	publicAPIGroup.GET("/domains", c.DomainHandler.GetPublicDomains)
	publicAPIGroup.GET("/bugs", c.BugHandler.GetPublicBugs)

	// 4. Rate Limited Checker Routes
	checkerGroup := e.Group("/api")
	checkerGroup.Use(publicCORS)
	checkerGroup.Use(custommiddleware.CheckerRateLimiter.Limit())
	checkerGroup.GET("/check/:ips", c.ProxyHandler.CheckProxies)
	checkerGroup.GET("/check", c.ProxyHandler.CheckProxies)
}

func fmtValidationErrorMessage(err validator.FieldError) string {
	field := err.Field()
	// Clean or translate to user-friendly messages
	switch err.Tag() {
	case "required":
		return field + ": is required"
	case "min":
		return field + ": must be at least " + err.Param() + " characters long"
	default:
		return field + ": validation failed on '" + err.Tag() + "'"
	}
}
