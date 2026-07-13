package usecase

import (
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/repository"
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
}

func NewDashboardUseCase(
	proxyRepo repository.ProxyRepository,
	domainRepo repository.DomainRepository,
	bugRepo repository.BugRepository,
) DashboardUseCase {
	return &dashboardUseCaseImpl{
		proxyRepo:  proxyRepo,
		domainRepo: domainRepo,
		bugRepo:    bugRepo,
	}
}

func (u *dashboardUseCaseImpl) GetStats() (*DashboardStats, error) {
	proxiesCount, err := u.proxyRepo.Count()
	if err != nil {
		return nil, err
	}

	domainsCount, err := u.domainRepo.Count()
	if err != nil {
		return nil, err
	}

	bugsCount, err := u.bugRepo.Count()
	if err != nil {
		return nil, err
	}

	return &DashboardStats{
		Proxies: proxiesCount,
		Domains: domainsCount,
		Bugs:    bugsCount,
	}, nil
}
