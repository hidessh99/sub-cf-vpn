package repository

import (
	"context"
	"errors"
	"time"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/auth/domain"
	"gorm.io/gorm"
)

type adminRepository struct {
	db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) domain.AdminRepository {
	return &adminRepository{db: db}
}

func (r *adminRepository) FindByUsername(ctx context.Context, username string) (*domain.Admin, error) {
	var admin domain.Admin
	err := r.db.WithContext(ctx).Where("username = ?", username).First(&admin).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &admin, nil
}

func (r *adminRepository) FindByID(ctx context.Context, id uint) (*domain.Admin, error) {
	var admin domain.Admin
	err := r.db.WithContext(ctx).First(&admin, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &admin, nil
}

func (r *adminRepository) UpdatePassword(ctx context.Context, id uint, newHash string) error {
	return r.db.WithContext(ctx).Model(&domain.Admin{}).Where("id = ?", id).Updates(map[string]interface{}{
		"password":   newHash,
		"updated_at": time.Now(),
	}).Error
}
