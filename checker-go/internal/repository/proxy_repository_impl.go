package repository

import (
	"errors"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/repository"
	"gorm.io/gorm"
)

type proxyRepositoryImpl struct {
	db *gorm.DB
}

func NewProxyRepository(db *gorm.DB) repository.ProxyRepository {
	return &proxyRepositoryImpl{db: db}
}

func (r *proxyRepositoryImpl) FindAll(page, limit int, filters repository.ProxyFilters) ([]entity.Proxy, int64, error) {
	var total int64
	var proxies []entity.Proxy

	query := r.db.Model(&entity.Proxy{})

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

	// Count total matching records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Paginate and fetch records
	offset := (page - 1) * limit
	err := query.Order("id DESC").Offset(offset).Limit(limit).Find(&proxies).Error
	if err != nil {
		return nil, 0, err
	}

	return proxies, total, nil
}

func (r *proxyRepositoryImpl) FindByID(id uint) (*entity.Proxy, error) {
	var proxy entity.Proxy
	err := r.db.First(&proxy, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &proxy, nil
}

func (r *proxyRepositoryImpl) Create(proxy *entity.Proxy) error {
	return r.db.Create(proxy).Error
}

func (r *proxyRepositoryImpl) Update(id uint, proxy *entity.Proxy) error {
	// GORM updates non-zero values by default. Since we pass a partial update struct, GORM updates it nicely.
	// But let's perform standard Update operation on maps or GORM model attributes to ensure all values are correctly updated.
	return r.db.Model(&entity.Proxy{}).Where("id = ?", id).Updates(proxy).Error
}

func (r *proxyRepositoryImpl) Delete(id uint) error {
	return r.db.Delete(&entity.Proxy{}, id).Error
}

func (r *proxyRepositoryImpl) BulkCreate(proxies []entity.Proxy) (int64, error) {
	if len(proxies) == 0 {
		return 0, nil
	}
	err := r.db.CreateInBatches(proxies, 100).Error
	if err != nil {
		return 0, err
	}
	return int64(len(proxies)), nil
}

func (r *proxyRepositoryImpl) GetPublicList() ([]entity.Proxy, error) {
	var proxies []entity.Proxy
	err := r.db.Where("is_active = ?", true).Find(&proxies).Error
	if err != nil {
		return nil, err
	}
	return proxies, nil
}

func (r *proxyRepositoryImpl) Count() (int64, error) {
	var count int64
	err := r.db.Model(&entity.Proxy{}).Count(&count).Error
	return count, err
}

func (r *proxyRepositoryImpl) FindAllActive() ([]entity.Proxy, error) {
	var proxies []entity.Proxy
	err := r.db.Where("is_active = ?", true).Find(&proxies).Error
	if err != nil {
		return nil, err
	}
	return proxies, nil
}

func (r *proxyRepositoryImpl) BulkDelete(ids []uint) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	result := r.db.Where("id IN ?", ids).Delete(&entity.Proxy{})
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}

func (r *proxyRepositoryImpl) DeleteAll() (int64, error) {
	result := r.db.Where("1 = 1").Delete(&entity.Proxy{})
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}
