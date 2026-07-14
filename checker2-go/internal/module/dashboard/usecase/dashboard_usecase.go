package usecase

import (
	"context"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/dashboard/port"
	sharedPort "github.com/hidessh99/sub-cf-vpn/checker2-go/internal/shared/port"
)

type DashboardUseCase interface {
	GetStats(ctx context.Context) (*port.DashboardStats, error)
}

type dashboardUseCase struct {
	statsProvider port.StatsProvider
	log           sharedPort.Logger
}

func NewDashboardUseCase(statsProvider port.StatsProvider, log sharedPort.Logger) DashboardUseCase {
	return &dashboardUseCase{
		statsProvider: statsProvider,
		log:           log,
	}
}

func (u *dashboardUseCase) GetStats(ctx context.Context) (*port.DashboardStats, error) {
	u.log.Debug("Retrieving dashboard stats", "DashboardUseCase")

	proxiesCount, err := u.statsProvider.ProxyCount(ctx)
	if err != nil {
		u.log.Error("Database error during proxies count retrieval", err, "DashboardUseCase")
		return nil, err
	}

	domainsCount, err := u.statsProvider.DomainCount(ctx)
	if err != nil {
		u.log.Error("Database error during domains count retrieval", err, "DashboardUseCase")
		return nil, err
	}

	bugsCount, err := u.statsProvider.BugCount(ctx)
	if err != nil {
		u.log.Error("Database error during bugs count retrieval", err, "DashboardUseCase")
		return nil, err
	}

	return &port.DashboardStats{
		Proxies: proxiesCount,
		Domains: domainsCount,
		Bugs:    bugsCount,
	}, nil
}
