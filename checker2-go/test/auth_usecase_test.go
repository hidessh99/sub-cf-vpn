package test

import (
	"context"
	"errors"
	"testing"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/auth/domain"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/auth/usecase"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/pkg/apperror"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/pkg/password"
)

type MockAdminRepository struct {
	FindByUsernameFunc func(ctx context.Context, username string) (*domain.Admin, error)
	FindByIDFunc       func(ctx context.Context, id uint) (*domain.Admin, error)
	UpdatePasswordFunc func(ctx context.Context, id uint, newHash string) error
}

func (m *MockAdminRepository) FindByUsername(ctx context.Context, username string) (*domain.Admin, error) {
	return m.FindByUsernameFunc(ctx, username)
}

func (m *MockAdminRepository) FindByID(ctx context.Context, id uint) (*domain.Admin, error) {
	return m.FindByIDFunc(ctx, id)
}

func (m *MockAdminRepository) UpdatePassword(ctx context.Context, id uint, newHash string) error {
	return m.UpdatePasswordFunc(ctx, id, newHash)
}

func TestLoginSuccess(t *testing.T) {
	plainPass := "admin123"
	hashedPass, _ := password.HashPassword(plainPass)

	mockRepo := &MockAdminRepository{
		FindByUsernameFunc: func(ctx context.Context, username string) (*domain.Admin, error) {
			return &domain.Admin{
				ID:       1,
				Username: "admin",
				Password: hashedPass,
			}, nil
		},
	}

	authUC := usecase.NewAuthUseCase(mockRepo, testConfig(), testLogger())

	token, admin, err := authUC.Login(context.Background(), "admin", plainPass)
	if err != nil {
		t.Fatalf("Login returned unexpected error: %v", err)
	}

	if token == "" {
		t.Error("Expected non-empty token")
	}

	if admin == nil {
		t.Fatal("Expected non-nil admin")
	}

	if admin.Username != "admin" {
		t.Errorf("Expected username 'admin', got %s", admin.Username)
	}

	if admin.Password != "" {
		t.Error("Expected password field to be cleared in returned model")
	}
}

func TestLoginUserNotFound(t *testing.T) {
	mockRepo := &MockAdminRepository{
		FindByUsernameFunc: func(ctx context.Context, username string) (*domain.Admin, error) {
			return nil, nil // user not found
		},
	}

	authUC := usecase.NewAuthUseCase(mockRepo, testConfig(), testLogger())

	_, _, err := authUC.Login(context.Background(), "unknown", "anypassword")
	if err == nil {
		t.Fatal("Expected login to fail, but it succeeded")
	}

	var appErr *apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode != 401 {
		t.Errorf("Expected unauthorized error (401), got: %v", err)
	}
}

func TestLoginIncorrectPassword(t *testing.T) {
	correctPass := "secret"
	hashedPass, _ := password.HashPassword(correctPass)

	mockRepo := &MockAdminRepository{
		FindByUsernameFunc: func(ctx context.Context, username string) (*domain.Admin, error) {
			return &domain.Admin{
				ID:       1,
				Username: "admin",
				Password: hashedPass,
			}, nil
		},
	}

	authUC := usecase.NewAuthUseCase(mockRepo, testConfig(), testLogger())

	_, _, err := authUC.Login(context.Background(), "admin", "wrongpassword")
	if err == nil {
		t.Fatal("Expected login to fail due to incorrect password, but it succeeded")
	}

	var appErr *apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode != 401 {
		t.Errorf("Expected unauthorized error (401), got: %v", err)
	}
}

func TestChangePasswordSuccess(t *testing.T) {
	oldPass := "oldPass123"
	hashedOldPass, _ := password.HashPassword(oldPass)
	newPass := "newSecurePass"

	updateInvoked := false
	mockRepo := &MockAdminRepository{
		FindByIDFunc: func(ctx context.Context, id uint) (*domain.Admin, error) {
			return &domain.Admin{
				ID:       1,
				Username: "admin",
				Password: hashedOldPass,
			}, nil
		},
		UpdatePasswordFunc: func(ctx context.Context, id uint, newHash string) error {
			updateInvoked = true
			if err := password.VerifyPassword(newPass, newHash); err != nil {
				t.Errorf("VerifyPassword on new hash failed: %v", err)
			}
			return nil
		},
	}

	authUC := usecase.NewAuthUseCase(mockRepo, testConfig(), testLogger())

	err := authUC.ChangePassword(context.Background(), 1, oldPass, newPass)
	if err != nil {
		t.Fatalf("ChangePassword returned unexpected error: %v", err)
	}

	if !updateInvoked {
		t.Error("Expected UpdatePassword to be invoked in repository")
	}
}

func TestChangePasswordIncorrectCurrentPassword(t *testing.T) {
	oldPass := "oldPass123"
	hashedOldPass, _ := password.HashPassword(oldPass)

	mockRepo := &MockAdminRepository{
		FindByIDFunc: func(ctx context.Context, id uint) (*domain.Admin, error) {
			return &domain.Admin{
				ID:       1,
				Username: "admin",
				Password: hashedOldPass,
			}, nil
		},
	}

	authUC := usecase.NewAuthUseCase(mockRepo, testConfig(), testLogger())

	err := authUC.ChangePassword(context.Background(), 1, "wrongCurrentPass", "newSecurePass")
	if err == nil {
		t.Fatal("Expected ChangePassword to fail due to incorrect current password")
	}

	var appErr *apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode != 400 {
		t.Errorf("Expected bad request validation error (400), got: %v", err)
	}
}

func TestChangePasswordTooShortNewPassword(t *testing.T) {
	oldPass := "oldPass123"
	hashedOldPass, _ := password.HashPassword(oldPass)

	mockRepo := &MockAdminRepository{
		FindByIDFunc: func(ctx context.Context, id uint) (*domain.Admin, error) {
			return &domain.Admin{
				ID:       1,
				Username: "admin",
				Password: hashedOldPass,
			}, nil
		},
	}

	authUC := usecase.NewAuthUseCase(mockRepo, testConfig(), testLogger())

	err := authUC.ChangePassword(context.Background(), 1, oldPass, "short")
	if err == nil {
		t.Fatal("Expected ChangePassword to fail due to short new password")
	}

	var appErr *apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode != 400 {
		t.Errorf("Expected validation error (400), got: %v", err)
	}
}
