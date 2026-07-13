package repository

import (
	"errors"
	"time"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/repository"
	"gorm.io/gorm"
)

type adminRepositoryImpl struct {
	db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) repository.AdminRepository {
	return &adminRepositoryImpl{db: db}
}

func (r *adminRepositoryImpl) FindByUsername(username string) (*entity.Admin, error) {
	var admin entity.Admin
	err := r.db.Where("username = ?", username).First(&admin).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &admin, nil
}

func (r *adminRepositoryImpl) FindByID(id uint) (*entity.Admin, error) {
	var admin entity.Admin
	err := r.db.First(&admin, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &admin, nil
}

func (r *adminRepositoryImpl) UpdatePassword(id uint, newHash string) error {
	return r.db.Model(&entity.Admin{}).Where("id = ?", id).Updates(map[string]interface{}{
		"password":   newHash,
		"updated_at": time.Now(),
	}).Error
}
