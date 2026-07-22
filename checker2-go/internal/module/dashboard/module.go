package dashboard

import (
	"context"

	bugPort "github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/bug/port"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/dashboard/delivery"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/dashboard/port"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/dashboard/usecase"
	domainPort "github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/domain_mgmt/port"
	proxyPort "github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/proxy/port"
	sharedPort "github.com/hidessh99/sub-cf-vpn/checker2-go/internal/shared/port"
	"github.com/labstack/echo/v4"
)

type statsAdapter struct {
	proxyCounter  proxyPort.ProxyCounter
	domainCounter domainPort.DomainCounter
	bugCounter    bugPort.BugCounter
}

func NewStatsAdapter(
	proxyCounter proxyPort.ProxyCounter,
	domainCounter domainPort.DomainCounter,
	bugCounter bugPort.BugCounter,
) port.StatsProvider {
	return &statsAdapter{
		proxyCounter:  proxyCounter,
		domainCounter: domainCounter,
		bugCounter:    bugCounter,
	}
}

func (a *statsAdapter) ProxyCount(ctx context.Context) (int64, error) {
	return a.proxyCounter.Count(ctx)
}

func (a *statsAdapter) DomainCount(ctx context.Context) (int64, error) {
	return a.domainCounter.Count(ctx)
}

func (a *statsAdapter) BugCount(ctx context.Context) (int64, error) {
	return a.bugCounter.Count(ctx)
}

type DashboardModule struct {
	Handler *delivery.DashboardHandler
	log     sharedPort.Logger
}

func NewDashboardModule(statsProvider port.StatsProvider, log sharedPort.Logger) *DashboardModule {
	dashboardUC := usecase.NewDashboardUseCase(statsProvider, log)
	handler := delivery.NewDashboardHandler(dashboardUC, log)

	return &DashboardModule{
		Handler: handler,
		log:     log,
	}
}

func (m *DashboardModule) RegisterRoutes(adminGroup *echo.Group) {
	delivery.RegisterRoutes(adminGroup, m.Handler)
}
