package usecase

import (
	"context"
	"fmt"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/infrastructure/config"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/auth/domain"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/shared/port"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/pkg/apperror"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/pkg/jwt"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/pkg/password"
)

type AuthUseCase interface {
	Login(ctx context.Context, username, passwordPlain string) (string, *domain.Admin, error)
	GetProfile(ctx context.Context, adminID uint) (*domain.Admin, error)
	ChangePassword(ctx context.Context, adminID uint, oldPasswordPlain, newPasswordPlain string) error
}

type authUseCase struct {
	adminRepo domain.AdminRepository
	cfg       *config.AppConfig
	log       port.Logger
}

func NewAuthUseCase(adminRepo domain.AdminRepository, cfg *config.AppConfig, log port.Logger) AuthUseCase {
	return &authUseCase{
		adminRepo: adminRepo,
		cfg:       cfg,
		log:       log,
	}
}

func (u *authUseCase) Login(ctx context.Context, username, passwordPlain string) (string, *domain.Admin, error) {
	admin, err := u.adminRepo.FindByUsername(ctx, username)
	if err != nil {
		u.log.Error("Database error during username search", err, "AuthUseCase")
		return "", nil, err
	}

	if admin == nil {
		u.log.Warn(fmt.Sprintf("Login failed - user not found: %s", username), "AuthUseCase")
		return "", nil, apperror.NewUnauthorizedError("Invalid username or password")
	}

	err = password.VerifyPassword(passwordPlain, admin.Password)
	if err != nil {
		u.log.Warn(fmt.Sprintf("Login failed - invalid password for user: %s", username), "AuthUseCase")
		return "", nil, apperror.NewUnauthorizedError("Invalid username or password")
	}

	// Generate JWT token
	claims := map[string]interface{}{
		"id":       admin.ID,
		"username": admin.Username,
	}

	token, err := jwt.SignToken(claims, u.cfg.JWT.Secret, u.cfg.JWT.ExpiresIn)
	if err != nil {
		u.log.Error("Failed to sign JWT token", err, "AuthUseCase")
		return "", nil, err
	}

	// Clear password in returning model
	admin.Password = ""

	return token, admin, nil
}

func (u *authUseCase) GetProfile(ctx context.Context, adminID uint) (*domain.Admin, error) {
	u.log.Debug(fmt.Sprintf("Fetching profile for admin id=%d", adminID), "AuthUseCase")

	admin, err := u.adminRepo.FindByID(ctx, adminID)
	if err != nil {
		u.log.Error(fmt.Sprintf("Database error during profile retrieval for admin id=%d", adminID), err, "AuthUseCase")
		return nil, err
	}

	if admin == nil {
		u.log.Warn(fmt.Sprintf("Profile not found for admin id=%d", adminID), "AuthUseCase")
		return nil, apperror.NewNotFoundError("Admin not found")
	}

	// Clear password in returning model
	admin.Password = ""

	return admin, nil
}

func (u *authUseCase) ChangePassword(ctx context.Context, adminID uint, oldPasswordPlain, newPasswordPlain string) error {
	admin, err := u.adminRepo.FindByID(ctx, adminID)
	if err != nil {
		u.log.Error(fmt.Sprintf("Database error during profile fetch for password change, admin id=%d", adminID), err, "AuthUseCase")
		return err
	}

	if admin == nil {
		u.log.Warn(fmt.Sprintf("Password change failed - admin not found: id=%d", adminID), "AuthUseCase")
		return apperror.NewNotFoundError("Admin not found")
	}

	err = password.VerifyPassword(oldPasswordPlain, admin.Password)
	if err != nil {
		u.log.Warn(fmt.Sprintf("Password change failed - incorrect current password for admin id=%d", adminID), "AuthUseCase")
		return apperror.NewValidationError("Incorrect current password")
	}

	if len(newPasswordPlain) < 6 {
		return apperror.NewValidationError("New password must be at least 6 characters long")
	}

	hashed, err := password.HashPassword(newPasswordPlain)
	if err != nil {
		u.log.Error("Failed to hash new password during password change", err, "AuthUseCase")
		return err
	}

	err = u.adminRepo.UpdatePassword(ctx, adminID, hashed)
	if err != nil {
		u.log.Error(fmt.Sprintf("Database error during password update for admin id=%d", adminID), err, "AuthUseCase")
		return err
	}

	return nil
}
