package proxy

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/infrastructure/config"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/proxy/adapter"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/proxy/delivery"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/proxy/port"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/proxy/repository"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/proxy/usecase"
	sharedPort "github.com/hidessh99/sub-cf-vpn/checker2-go/internal/shared/port"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type ProxyModule struct {
	Handler *delivery.ProxyHandler
	UseCase usecase.ProxyUseCase
	Counter port.ProxyCounter
	cfg     *config.AppConfig
	log     sharedPort.Logger
}

func NewProxyModule(db *gorm.DB, cfg *config.AppConfig, log sharedPort.Logger) *ProxyModule {
	proxyRepo := repository.NewProxyRepository(db)
	tcpChecker := adapter.NewTCPChecker()
	geoIPService := adapter.NewGeoIPService()

	proxyUC := usecase.NewProxyUseCase(proxyRepo, tcpChecker, geoIPService, cfg, log)
	handler := delivery.NewProxyHandler(proxyUC, tcpChecker, log)

	counter, ok := proxyUC.(port.ProxyCounter)
	if !ok {
		panic("proxyUseCase does not implement port.ProxyCounter")
	}

	return &ProxyModule{
		Handler: handler,
		UseCase: proxyUC,
		Counter: counter,
		cfg:     cfg,
		log:     log,
	}
}

func (m *ProxyModule) RegisterRoutes(adminGroup *echo.Group, publicGroup *echo.Group, checkerGroup *echo.Group) {
	delivery.RegisterRoutes(adminGroup, publicGroup, checkerGroup, m.Handler)
}

func (m *ProxyModule) StartHealthCron(ctx context.Context, wg *sync.WaitGroup) {
	cronConfig := m.cfg.CronCheck
	if !cronConfig.Enabled {
		m.log.Info("Cron check is disabled in config.", "CronCheck")
		return
	}

	intervalHours := cronConfig.IntervalHours
	if intervalHours <= 0 {
		intervalHours = 24
	}

	m.log.Info(fmt.Sprintf("Proxy health check scheduled every %d hours.", intervalHours), "CronCheck")

	// Trigger initial run after 5 seconds
	wg.Add(1)
	go func() {
		defer wg.Done()
		select {
		case <-ctx.Done():
			return
		case <-time.After(5 * time.Second):
			m.UseCase.RunHealthCheckCycle(ctx)
		}
	}()

	// Ticker for subsequent runs
	ticker := time.NewTicker(time.Duration(intervalHours) * time.Hour)
	wg.Add(1)
	go func() {
		defer wg.Done()
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				m.log.Info("Cron checker ticker stopped.", "CronCheck")
				return
			case <-ticker.C:
				m.UseCase.RunHealthCheckCycle(ctx)
			}
		}
	}()
}
