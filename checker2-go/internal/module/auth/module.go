package auth

import (
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/infrastructure/config"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/infrastructure/server"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/auth/delivery"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/auth/repository"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/auth/usecase"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/shared/port"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type AuthModule struct {
	Handler           *delivery.AuthHandler
	RequireAuth       echo.MiddlewareFunc
	OptionalAuth      echo.MiddlewareFunc
	cfg               *config.AppConfig
}

func NewAuthModule(db *gorm.DB, cfg *config.AppConfig, log port.Logger) *AuthModule {
	adminRepo := repository.NewAdminRepository(db)
	authUC := usecase.NewAuthUseCase(adminRepo, cfg, log)
	handler := delivery.NewAuthHandler(authUC, log)

	return &AuthModule{
		Handler:      handler,
		RequireAuth:  delivery.RequireAuth(cfg),
		OptionalAuth: delivery.OptionalAuth(cfg),
		cfg:          cfg,
	}
}

func (m *AuthModule) RegisterRoutes(e *echo.Echo) {
	adminCORS := server.GetAdminCORS(m.cfg)
	delivery.RegisterRoutes(e, m.Handler, m.cfg, adminCORS)
}
