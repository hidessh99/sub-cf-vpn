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
	authUseCase := usecase.NewAuthUseCase(adminRepo, cfg)
	proxyUseCase := usecase.NewProxyUseCase(proxyRepo, geoIPService, cfg, log)
	domainUseCase := usecase.NewDomainUseCase(domainRepo)
	bugUseCase := usecase.NewBugUseCase(bugRepo)
	dashboardUseCase := usecase.NewDashboardUseCase(proxyRepo, domainRepo, bugRepo)

	// 4. Handlers
	authHandler := handler.NewAuthHandler(authUseCase)
	proxyHandler := handler.NewProxyHandler(proxyUseCase)
	domainHandler := handler.NewDomainHandler(domainUseCase)
	bugHandler := handler.NewBugHandler(bugUseCase)
	dashboardHandler := handler.NewDashboardHandler(dashboardUseCase)
	systemHandler := handler.NewSystemHandler(db)

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
