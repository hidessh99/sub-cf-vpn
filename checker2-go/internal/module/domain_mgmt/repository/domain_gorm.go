package repository

import (
	"context"
	"errors"
	"strings"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/domain_mgmt/domain"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type domainRepository struct {
	db *gorm.DB
}

func NewDomainRepository(db *gorm.DB) domain.DomainRepository {
	return &domainRepository{db: db}
}

func (r *domainRepository) FindAll(ctx context.Context) ([]domain.DomainEntry, error) {
	domains := make([]domain.DomainEntry, 0)
	err := r.db.WithContext(ctx).Order("id DESC").Find(&domains).Error
	if err != nil {
		return nil, err
	}
	return domains, nil
}

func (r *domainRepository) FindByDomain(ctx context.Context, domainName string) (*domain.DomainEntry, error) {
	var entry domain.DomainEntry
	err := r.db.WithContext(ctx).Where("domain = ?", domainName).First(&entry).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &entry, nil
}

func (r *domainRepository) Create(ctx context.Context, entry *domain.DomainEntry) error {
	return r.db.WithContext(ctx).Create(entry).Error
}

func (r *domainRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.DomainEntry{}, id).Error
}

func (r *domainRepository) BulkCreate(ctx context.Context, domains []string) (int64, error) {
	if len(domains) == 0 {
		return 0, nil
	}

	var entries []domain.DomainEntry
	for _, d := range domains {
		clean := strings.ToLower(strings.TrimSpace(d))
		if clean != "" {
			entries = append(entries, domain.DomainEntry{
				Domain:   clean,
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

func (r *domainRepository) GetPublicList(ctx context.Context) ([]string, error) {
	list := make([]string, 0)
	err := r.db.WithContext(ctx).Model(&domain.DomainEntry{}).Where("is_active = ?", true).Pluck("domain", &list).Error
	if err != nil {
		return nil, err
	}
	return list, nil
}

func (r *domainRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.DomainEntry{}).Count(&count).Error
	return count, err
}
