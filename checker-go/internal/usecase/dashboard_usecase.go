package usecase

import (
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/repository"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/logger"
)

type DashboardStats struct {
	Proxies int64 `json:"proxies"`
	Domains int64 `json:"domains"`
	Bugs    int64 `json:"bugs"`
}

type DashboardUseCase interface {
	GetStats() (*DashboardStats, error)
}

type dashboardUseCaseImpl struct {
	proxyRepo  repository.ProxyRepository
	domainRepo repository.DomainRepository
	bugRepo    repository.BugRepository
	log        *logger.LogrusLogger
}

func NewDashboardUseCase(
	proxyRepo repository.ProxyRepository,
	domainRepo repository.DomainRepository,
	bugRepo repository.BugRepository,
	log *logger.LogrusLogger,
) DashboardUseCase {
	return &dashboardUseCaseImpl{
		proxyRepo:  proxyRepo,
		domainRepo: domainRepo,
		bugRepo:    bugRepo,
		log:        log,
	}
}

func (u *dashboardUseCaseImpl) GetStats() (*DashboardStats, error) {
	u.log.Debug("Retrieving dashboard stats", "DashboardUseCase")

	proxiesCount, err := u.proxyRepo.Count()
	if err != nil {
		u.log.Error("Database error during proxies count retrieval", err, "DashboardUseCase")
		return nil, err
	}

	domainsCount, err := u.domainRepo.Count()
	if err != nil {
		u.log.Error("Database error during domains count retrieval", err, "DashboardUseCase")
		return nil, err
	}

	bugsCount, err := u.bugRepo.Count()
	if err != nil {
		u.log.Error("Database error during bugs count retrieval", err, "DashboardUseCase")
		return nil, err
	}

	return &DashboardStats{
		Proxies: proxiesCount,
		Domains: domainsCount,
		Bugs:    bugsCount,
	}, nil
}
