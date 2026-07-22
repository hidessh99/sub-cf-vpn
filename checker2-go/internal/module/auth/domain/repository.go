package domain

import "context"

type AdminRepository interface {
	FindByUsername(ctx context.Context, username string) (*Admin, error)
	FindByID(ctx context.Context, id uint) (*Admin, error)
	UpdatePassword(ctx context.Context, id uint, newHash string) error
}
