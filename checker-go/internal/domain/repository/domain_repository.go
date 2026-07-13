package repository

import "github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"

type DomainRepository interface {
	FindAll() ([]entity.DomainEntry, error)
	FindByDomain(domain string) (*entity.DomainEntry, error)
	Create(domain *entity.DomainEntry) error
	Delete(id uint) error
	BulkCreate(domains []string) (int64, error)
	GetPublicList() ([]string, error)
	Count() (int64, error)
}
