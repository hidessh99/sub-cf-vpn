package repository

import "github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"

type BugRepository interface {
	FindAll() ([]entity.Bug, error)
	FindByHostname(hostname string) (*entity.Bug, error)
	Create(bug *entity.Bug) error
	Delete(id uint) error
	BulkCreate(hostnames []string) (int64, error)
	GetPublicList() ([]string, error)
	Count() (int64, error)
}
