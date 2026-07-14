package delivery

import (
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/infrastructure/config"
	custommiddleware "github.com/hidessh99/sub-cf-vpn/checker2-go/internal/shared/middleware"
	"github.com/labstack/echo/v4"
)

func RegisterRoutes(e *echo.Echo, handler *AuthHandler, cfg *config.AppConfig, adminCORS echo.MiddlewareFunc) {
	authGroup := e.Group("/api/v1/auth")
	authGroup.Use(adminCORS)
	authGroup.POST("/login", handler.Login, custommiddleware.LoginRateLimiter.Limit())
	authGroup.GET("/me", handler.GetProfile, RequireAuth(cfg))
	authGroup.PUT("/password", handler.ChangePassword, RequireAuth(cfg))
}
