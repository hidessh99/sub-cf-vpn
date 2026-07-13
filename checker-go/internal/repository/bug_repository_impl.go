package repository

import (
	"errors"
	"strings"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/repository"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type bugRepositoryImpl struct {
	db *gorm.DB
}

func NewBugRepository(db *gorm.DB) repository.BugRepository {
	return &bugRepositoryImpl{db: db}
}

func (r *bugRepositoryImpl) FindAll() ([]entity.Bug, error) {
	var bugs []entity.Bug
	err := r.db.Order("id DESC").Find(&bugs).Error
	if err != nil {
		return nil, err
	}
	return bugs, nil
}

func (r *bugRepositoryImpl) FindByHostname(hostname string) (*entity.Bug, error) {
	var bug entity.Bug
	err := r.db.Where("hostname = ?", hostname).First(&bug).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &bug, nil
}

func (r *bugRepositoryImpl) Create(bug *entity.Bug) error {
	return r.db.Create(bug).Error
}

func (r *bugRepositoryImpl) Delete(id uint) error {
	return r.db.Delete(&entity.Bug{}, id).Error
}

func (r *bugRepositoryImpl) BulkCreate(hostnames []string) (int64, error) {
	if len(hostnames) == 0 {
		return 0, nil
	}

	var entries []entity.Bug
	for _, h := range hostnames {
		clean := strings.ToLower(strings.TrimSpace(h))
		if clean != "" {
			entries = append(entries, entity.Bug{
				Hostname: clean,
				IsActive: true,
			})
		}
	}

	if len(entries) == 0 {
		return 0, nil
	}

	// SQLite INSERT OR IGNORE behavior
	result := r.db.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(entries, 100)
	if result.Error != nil {
		return 0, result.Error
	}

	return result.RowsAffected, nil
}

func (r *bugRepositoryImpl) GetPublicList() ([]string, error) {
	var list []string
	err := r.db.Model(&entity.Bug{}).Where("is_active = ?", true).Pluck("hostname", &list).Error
	if err != nil {
		return nil, err
	}
	return list, nil
}

func (r *bugRepositoryImpl) Count() (int64, error) {
	var count int64
	err := r.db.Model(&entity.Bug{}).Count(&count).Error
	return count, err
}
