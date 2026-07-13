package container

import (
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/config"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/delivery/http/handler"
	impl "github.com/hidessh99/sub-cf-vpn/checker-go/internal/repository"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/logger"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/geoip"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/usecase"
	"gorm.io/gorm"
)

type Container struct {
	DB               *gorm.DB
	Config           *config.AppConfig
	Logger           *logger.LogrusLogger
	ProxyUseCase     usecase.ProxyUseCase
	AuthHandler      *handler.AuthHandler
	ProxyHandler     *handler.ProxyHandler
	DomainHandler    *handler.DomainHandler
	BugHandler       *handler.BugHandler
	DashboardHandler *handler.DashboardHandler
	SystemHandler    *handler.SystemHandler
}

func Wire(db *gorm.DB, cfg *config.AppConfig, log *logger.LogrusLogger) *Container {
	// 1. Repositories
	adminRepo := impl.NewAdminRepository(db)
	proxyRepo := impl.NewProxyRepository(db)
	domainRepo := impl.NewDomainRepository(db)
	bugRepo := impl.NewBugRepository(db)

	// 2. Services
	geoIPService := geoip.NewGeoIPService()

	// 3. Use Cases
	authUseCase := usecase.NewAuthUseCase(adminRepo, cfg, log)
	proxyUseCase := usecase.NewProxyUseCase(proxyRepo, geoIPService, cfg, log)
	domainUseCase := usecase.NewDomainUseCase(domainRepo, log)
	bugUseCase := usecase.NewBugUseCase(bugRepo, log)
	dashboardUseCase := usecase.NewDashboardUseCase(proxyRepo, domainRepo, bugRepo, log)

	// 4. Handlers
	authHandler := handler.NewAuthHandler(authUseCase, log)
	proxyHandler := handler.NewProxyHandler(proxyUseCase, log)
	domainHandler := handler.NewDomainHandler(domainUseCase, log)
	bugHandler := handler.NewBugHandler(bugUseCase, log)
	dashboardHandler := handler.NewDashboardHandler(dashboardUseCase, log)
	systemHandler := handler.NewSystemHandler(db, log)

	return &Container{
		DB:               db,
		Config:           cfg,
		Logger:           log,
		ProxyUseCase:     proxyUseCase,
		AuthHandler:      authHandler,
		ProxyHandler:     proxyHandler,
		DomainHandler:    domainHandler,
		BugHandler:       bugHandler,
		DashboardHandler: dashboardHandler,
		SystemHandler:    systemHandler,
	}
}
