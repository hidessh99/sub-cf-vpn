package repository

import (
	"context"
	"errors"
	"strings"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/bug/domain"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type bugRepository struct {
	db *gorm.DB
}

func NewBugRepository(db *gorm.DB) domain.BugRepository {
	return &bugRepository{db: db}
}

func (r *bugRepository) FindAll(ctx context.Context) ([]domain.Bug, error) {
	bugs := make([]domain.Bug, 0)
	err := r.db.WithContext(ctx).Order("id DESC").Find(&bugs).Error
	if err != nil {
		return nil, err
	}
	return bugs, nil
}

func (r *bugRepository) FindByHostname(ctx context.Context, hostname string) (*domain.Bug, error) {
	var bug domain.Bug
	err := r.db.WithContext(ctx).Where("hostname = ?", hostname).First(&bug).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &bug, nil
}

func (r *bugRepository) Create(ctx context.Context, bug *domain.Bug) error {
	return r.db.WithContext(ctx).Create(bug).Error
}

func (r *bugRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.Bug{}, id).Error
}

func (r *bugRepository) BulkCreate(ctx context.Context, hostnames []string) (int64, error) {
	if len(hostnames) == 0 {
		return 0, nil
	}

	var entries []domain.Bug
	for _, h := range hostnames {
		clean := strings.ToLower(strings.TrimSpace(h))
		if clean != "" {
			entries = append(entries, domain.Bug{
				Hostname: clean,
				IsActive: true,
			})
		}
	}

	if len(entries) == 0 {
		return 0, nil
	}

	result := r.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(entries, 100)
	if result.Error != nil {
		return 0, result.Error
	}

	return result.RowsAffected, nil
}

func (r *bugRepository) GetPublicList(ctx context.Context) ([]string, error) {
	list := make([]string, 0)
	err := r.db.WithContext(ctx).Model(&domain.Bug{}).Where("is_active = ?", true).Pluck("hostname", &list).Error
	if err != nil {
		return nil, err
	}
	return list, nil
}

func (r *bugRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.Bug{}).Count(&count).Error
	return count, err
}
