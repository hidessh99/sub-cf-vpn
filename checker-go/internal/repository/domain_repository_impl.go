package repository

import (
	"errors"
	"strings"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/repository"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type domainRepositoryImpl struct {
	db *gorm.DB
}

func NewDomainRepository(db *gorm.DB) repository.DomainRepository {
	return &domainRepositoryImpl{db: db}
}

func (r *domainRepositoryImpl) FindAll() ([]entity.DomainEntry, error) {
	var domains []entity.DomainEntry
	err := r.db.Order("id DESC").Find(&domains).Error
	if err != nil {
		return nil, err
	}
	return domains, nil
}

func (r *domainRepositoryImpl) FindByDomain(domain string) (*entity.DomainEntry, error) {
	var entry entity.DomainEntry
	err := r.db.Where("domain = ?", domain).First(&entry).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &entry, nil
}

func (r *domainRepositoryImpl) Create(domain *entity.DomainEntry) error {
	return r.db.Create(domain).Error
}

func (r *domainRepositoryImpl) Delete(id uint) error {
	return r.db.Delete(&entity.DomainEntry{}, id).Error
}

func (r *domainRepositoryImpl) BulkCreate(domains []string) (int64, error) {
	if len(domains) == 0 {
		return 0, nil
	}

	var entries []entity.DomainEntry
	for _, d := range domains {
		clean := strings.ToLower(strings.TrimSpace(d))
		if clean != "" {
			entries = append(entries, entity.DomainEntry{
				Domain:   clean,
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

func (r *domainRepositoryImpl) GetPublicList() ([]string, error) {
	var list []string
	err := r.db.Model(&entity.DomainEntry{}).Where("is_active = ?", true).Pluck("domain", &list).Error
	if err != nil {
		return nil, err
	}
	return list, nil
}

func (r *domainRepositoryImpl) Count() (int64, error) {
	var count int64
	err := r.db.Model(&entity.DomainEntry{}).Count(&count).Error
	return count, err
}
