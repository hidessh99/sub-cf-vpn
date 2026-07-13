package repository

import "github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"

type AdminRepository interface {
	FindByUsername(username string) (*entity.Admin, error)
	FindByID(id uint) (*entity.Admin, error)
	UpdatePassword(id uint, newHash string) error
}
