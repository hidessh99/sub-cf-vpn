package domain

import "context"

type DomainRepository interface {
	FindAll(ctx context.Context) ([]DomainEntry, error)
	FindByDomain(ctx context.Context, domain string) (*DomainEntry, error)
	Create(ctx context.Context, entry *DomainEntry) error
	Delete(ctx context.Context, id uint) error
	BulkCreate(ctx context.Context, domains []string) (int64, error)
	GetPublicList(ctx context.Context) ([]string, error)
	Count(ctx context.Context) (int64, error)
}
