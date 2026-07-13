package repository

import "github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"

type ProxyFilters struct {
	Country  *string
	IsActive *bool
	Search   *string
}

type ProxyRepository interface {
	FindAll(page, limit int, filters ProxyFilters) ([]entity.Proxy, int64, error)
	FindByID(id uint) (*entity.Proxy, error)
	Create(proxy *entity.Proxy) error
	Update(id uint, proxy *entity.Proxy) error
	Delete(id uint) error
	BulkCreate(proxies []entity.Proxy) (int64, error)
	GetPublicList() ([]entity.Proxy, error)
	Count() (int64, error)
	FindAllActive() ([]entity.Proxy, error)
	BulkDelete(ids []uint) (int64, error)
	DeleteAll() (int64, error)
}
