package usecase

import (
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/config"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/repository"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/apperror"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/jwt"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/password"
)

type AuthUseCase interface {
	Login(username, passwordPlain string) (string, *entity.Admin, error)
	GetProfile(adminID uint) (*entity.Admin, error)
	ChangePassword(adminID uint, oldPasswordPlain, newPasswordPlain string) error
}

type authUseCaseImpl struct {
	adminRepo repository.AdminRepository
	cfg       *config.AppConfig
}

func NewAuthUseCase(adminRepo repository.AdminRepository, cfg *config.AppConfig) AuthUseCase {
	return &authUseCaseImpl{
		adminRepo: adminRepo,
		cfg:       cfg,
	}
}

func (u *authUseCaseImpl) Login(username, passwordPlain string) (string, *entity.Admin, error) {
	admin, err := u.adminRepo.FindByUsername(username)
	if err != nil {
		return "", nil, err
	}

	if admin == nil {
		return "", nil, apperror.NewUnauthorizedError("Invalid username or password")
	}

	err = password.VerifyPassword(passwordPlain, admin.Password)
	if err != nil {
		return "", nil, apperror.NewUnauthorizedError("Invalid username or password")
	}

	// Generate JWT token
	claims := map[string]interface{}{
		"id":       admin.ID,
		"username": admin.Username,
	}

	token, err := jwt.SignToken(claims, u.cfg.JWT.Secret, u.cfg.JWT.ExpiresIn)
	if err != nil {
		return "", nil, err
	}

	// Clear password in returning model
	admin.Password = ""

	return token, admin, nil
}

func (u *authUseCaseImpl) GetProfile(adminID uint) (*entity.Admin, error) {
	admin, err := u.adminRepo.FindByID(adminID)
	if err != nil {
		return nil, err
	}

	if admin == nil {
		return nil, apperror.NewNotFoundError("Admin not found")
	}

	// Clear password in returning model
	admin.Password = ""

	return admin, nil
}

func (u *authUseCaseImpl) ChangePassword(adminID uint, oldPasswordPlain, newPasswordPlain string) error {
	admin, err := u.adminRepo.FindByID(adminID)
	if err != nil {
		return err
	}

	if admin == nil {
		return apperror.NewNotFoundError("Admin not found")
	}

	err = password.VerifyPassword(oldPasswordPlain, admin.Password)
	if err != nil {
		return apperror.NewValidationError("Incorrect current password")
	}

	if len(newPasswordPlain) < 6 {
		return apperror.NewValidationError("New password must be at least 6 characters long")
	}

	hashed, err := password.HashPassword(newPasswordPlain)
	if err != nil {
		return err
	}

	return u.adminRepo.UpdatePassword(adminID, hashed)
}
