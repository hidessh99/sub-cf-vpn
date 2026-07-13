package test

import (
	"errors"
	"testing"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/apperror"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/password"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/usecase"
)

// MockAdminRepository implements repository.AdminRepository for testing
type MockAdminRepository struct {
	FindByUsernameFunc func(username string) (*entity.Admin, error)
	FindByIDFunc       func(id uint) (*entity.Admin, error)
	UpdatePasswordFunc func(id uint, newHash string) error
}

func (m *MockAdminRepository) FindByUsername(username string) (*entity.Admin, error) {
	return m.FindByUsernameFunc(username)
}

func (m *MockAdminRepository) FindByID(id uint) (*entity.Admin, error) {
	return m.FindByIDFunc(id)
}

func (m *MockAdminRepository) UpdatePassword(id uint, newHash string) error {
	return m.UpdatePasswordFunc(id, newHash)
}

func TestLoginSuccess(t *testing.T) {
	plainPass := "admin123"
	hashedPass, _ := password.HashPassword(plainPass)

	mockRepo := &MockAdminRepository{
		FindByUsernameFunc: func(username string) (*entity.Admin, error) {
			return &entity.Admin{
				ID:       1,
				Username: "admin",
				Password: hashedPass,
			}, nil
		},
	}

	authUC := usecase.NewAuthUseCase(mockRepo, testConfig(), testLogger())

	token, admin, err := authUC.Login("admin", plainPass)
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
		FindByUsernameFunc: func(username string) (*entity.Admin, error) {
			return nil, nil // user not found
		},
	}

	authUC := usecase.NewAuthUseCase(mockRepo, testConfig(), testLogger())

	_, _, err := authUC.Login("unknown", "anypassword")
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
		FindByUsernameFunc: func(username string) (*entity.Admin, error) {
			return &entity.Admin{
				ID:       1,
				Username: "admin",
				Password: hashedPass,
			}, nil
		},
	}

	authUC := usecase.NewAuthUseCase(mockRepo, testConfig(), testLogger())

	_, _, err := authUC.Login("admin", "wrongpassword")
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
		FindByIDFunc: func(id uint) (*entity.Admin, error) {
			return &entity.Admin{
				ID:       1,
				Username: "admin",
				Password: hashedOldPass,
			}, nil
		},
		UpdatePasswordFunc: func(id uint, newHash string) error {
			updateInvoked = true
			if err := password.VerifyPassword(newPass, newHash); err != nil {
				t.Errorf("VerifyPassword on new hash failed: %v", err)
			}
			return nil
		},
	}

	authUC := usecase.NewAuthUseCase(mockRepo, testConfig(), testLogger())

	err := authUC.ChangePassword(1, oldPass, newPass)
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
		FindByIDFunc: func(id uint) (*entity.Admin, error) {
			return &entity.Admin{
				ID:       1,
				Username: "admin",
				Password: hashedOldPass,
			}, nil
		},
	}

	authUC := usecase.NewAuthUseCase(mockRepo, testConfig(), testLogger())

	err := authUC.ChangePassword(1, "wrongCurrentPass", "newSecurePass")
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
		FindByIDFunc: func(id uint) (*entity.Admin, error) {
			return &entity.Admin{
				ID:       1,
				Username: "admin",
				Password: hashedOldPass,
			}, nil
		},
	}

	authUC := usecase.NewAuthUseCase(mockRepo, testConfig(), testLogger())

	err := authUC.ChangePassword(1, oldPass, "short") // length 5 (minimum is 6)
	if err == nil {
		t.Fatal("Expected ChangePassword to fail due to short new password")
	}

	var appErr *apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode != 400 {
		t.Errorf("Expected validation error (400), got: %v", err)
	}
}
