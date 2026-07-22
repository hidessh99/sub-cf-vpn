package domain

import "context"

type ProxyFilters struct {
	Country  *string
	IsActive *bool
	Search   *string
}

type ProxyRepository interface {
	FindAll(ctx context.Context, page, limit int, filters ProxyFilters) ([]Proxy, int64, error)
	FindByID(ctx context.Context, id uint) (*Proxy, error)
	Create(ctx context.Context, proxy *Proxy) error
	Update(ctx context.Context, id uint, proxy *Proxy) error
	Delete(ctx context.Context, id uint) error
	BulkCreate(ctx context.Context, proxies []Proxy) (int64, error)
	GetPublicList(ctx context.Context) ([]Proxy, error)
	Count(ctx context.Context) (int64, error)
	FindAllActive(ctx context.Context) ([]Proxy, error)
	BulkDelete(ctx context.Context, ids []uint) (int64, error)
	DeleteAll(ctx context.Context) (int64, error)
}
