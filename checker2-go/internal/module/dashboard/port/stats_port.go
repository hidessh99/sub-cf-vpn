package port

import "context"

type DashboardStats struct {
	Proxies int64 `json:"proxies"`
	Domains int64 `json:"domains"`
	Bugs    int64 `json:"bugs"`
}

type StatsProvider interface {
	ProxyCount(ctx context.Context) (int64, error)
	DomainCount(ctx context.Context) (int64, error)
	BugCount(ctx context.Context) (int64, error)
}
