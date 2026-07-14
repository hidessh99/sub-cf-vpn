package repository

import (
	"context"
	"errors"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/proxy/domain"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type proxyRepository struct {
	db *gorm.DB
}

func NewProxyRepository(db *gorm.DB) domain.ProxyRepository {
	return &proxyRepository{db: db}
}

func (r *proxyRepository) FindAll(ctx context.Context, page, limit int, filters domain.ProxyFilters) ([]domain.Proxy, int64, error) {
	var total int64
	var proxies []domain.Proxy

	query := r.db.WithContext(ctx).Model(&domain.Proxy{})

	if filters.Country != nil && *filters.Country != "" {
		query = query.Where("country = ?", *filters.Country)
	}

	if filters.IsActive != nil {
		query = query.Where("is_active = ?", *filters.IsActive)
	}

	if filters.Search != nil && *filters.Search != "" {
		searchPattern := "%" + *filters.Search + "%"
		query = query.Where(
			"ip LIKE ? OR proxy LIKE ? OR country LIKE ? OR as_organization LIKE ? OR colo LIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern, searchPattern,
		)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := query.Order("id DESC").Offset(offset).Limit(limit).Find(&proxies).Error
	if err != nil {
		return nil, 0, err
	}

	return proxies, total, nil
}

func (r *proxyRepository) FindByID(ctx context.Context, id uint) (*domain.Proxy, error) {
	var proxy domain.Proxy
	err := r.db.WithContext(ctx).First(&proxy, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &proxy, nil
}

func (r *proxyRepository) Create(ctx context.Context, proxy *domain.Proxy) error {
	return r.db.WithContext(ctx).Create(proxy).Error
}

func (r *proxyRepository) Update(ctx context.Context, id uint, proxy *domain.Proxy) error {
	return r.db.WithContext(ctx).Model(&domain.Proxy{}).Where("id = ?", id).Updates(proxy).Error
}

func (r *proxyRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.Proxy{}, id).Error
}

func (r *proxyRepository) BulkCreate(ctx context.Context, proxies []domain.Proxy) (int64, error) {
	if len(proxies) == 0 {
		return 0, nil
	}
	// SQLite INSERT OR IGNORE behavior
	result := r.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(proxies, 100)
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}

func (r *proxyRepository) GetPublicList(ctx context.Context) ([]domain.Proxy, error) {
	var proxies []domain.Proxy
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Find(&proxies).Error
	if err != nil {
		return nil, err
	}
	return proxies, nil
}

func (r *proxyRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.Proxy{}).Count(&count).Error
	return count, err
}

func (r *proxyRepository) FindAllActive(ctx context.Context) ([]domain.Proxy, error) {
	var proxies []domain.Proxy
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Find(&proxies).Error
	if err != nil {
		return nil, err
	}
	return proxies, nil
}

func (r *proxyRepository) BulkDelete(ctx context.Context, ids []uint) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	result := r.db.WithContext(ctx).Where("id IN ?", ids).Delete(&domain.Proxy{})
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}

func (r *proxyRepository) DeleteAll(ctx context.Context) (int64, error) {
	result := r.db.WithContext(ctx).Where("1 = 1").Delete(&domain.Proxy{})
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}
