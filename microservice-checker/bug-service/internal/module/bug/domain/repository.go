package domain

import "context"

type BugRepository interface {
	FindAll(ctx context.Context) ([]Bug, error)
	FindByHostname(ctx context.Context, hostname string) (*Bug, error)
	Create(ctx context.Context, bug *Bug) error
	Delete(ctx context.Context, id uint) error
	BulkCreate(ctx context.Context, hostnames []string) (int64, error)
	GetPublicList(ctx context.Context) ([]string, error)
	Count(ctx context.Context) (int64, error)
}
