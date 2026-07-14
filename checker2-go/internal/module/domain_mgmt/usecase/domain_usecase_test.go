package usecase

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/domain_mgmt/domain"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/pkg/apperror"
)

type MockDomainRepository struct {
	db []domain.DomainEntry
}

func (m *MockDomainRepository) FindAll(ctx context.Context) ([]domain.DomainEntry, error) {
	result := make([]domain.DomainEntry, len(m.db))
	for i := range m.db {
		result[i] = m.db[len(m.db)-1-i]
	}
	return result, nil
}

func (m *MockDomainRepository) FindByDomain(ctx context.Context, domainName string) (*domain.DomainEntry, error) {
	for _, d := range m.db {
		if d.Domain == domainName {
			return &d, nil
		}
	}
	return nil, nil
}

func (m *MockDomainRepository) Create(ctx context.Context, entry *domain.DomainEntry) error {
	entry.ID = uint(len(m.db) + 1)
	entry.CreatedAt = time.Now()
	m.db = append(m.db, *entry)
	return nil
}

func (m *MockDomainRepository) Delete(ctx context.Context, id uint) error {
	var filtered []domain.DomainEntry
	for _, d := range m.db {
		if d.ID != id {
			filtered = append(filtered, d)
		}
	}
	m.db = filtered
	return nil
}

func (m *MockDomainRepository) BulkCreate(ctx context.Context, domains []string) (int64, error) {
	var count int64
	for _, d := range domains {
		clean := strings.ToLower(strings.TrimSpace(d))
		if clean != "" {
			existing, _ := m.FindByDomain(ctx, clean)
			if existing == nil {
				_ = m.Create(ctx, &domain.DomainEntry{Domain: clean, IsActive: true})
				count++
			}
		}
	}
	return count, nil
}

func (m *MockDomainRepository) GetPublicList(ctx context.Context) ([]string, error) {
	var list []string
	for _, d := range m.db {
		if d.IsActive {
			list = append(list, d.Domain)
		}
	}
	return list, nil
}

func (m *MockDomainRepository) Count(ctx context.Context) (int64, error) {
	return int64(len(m.db)), nil
}

type dummyLogger struct{}

func (d dummyLogger) Debug(msg string, ctx string)             {}
func (d dummyLogger) Info(msg string, ctx string)              {}
func (d dummyLogger) Warn(msg string, ctx string)              {}
func (d dummyLogger) Error(msg string, err error, ctx string) {}

func TestCreateDomain(t *testing.T) {
	mockRepo := &MockDomainRepository{}
	domainUC := NewDomainUseCase(mockRepo, dummyLogger{})

	// Success create
	domainEntry, err := domainUC.CreateDomain(context.Background(), "google.com")
	if err != nil {
		t.Fatalf("CreateDomain returned unexpected error: %v", err)
	}
	if domainEntry.Domain != "google.com" {
		t.Errorf("Expected domain 'google.com', got %s", domainEntry.Domain)
	}

	// Trim and lowercase test
	domain2, err := domainUC.CreateDomain(context.Background(), "  CF-vPN.Net  ")
	if err != nil {
		t.Fatalf("CreateDomain returned unexpected error: %v", err)
	}
	if domain2.Domain != "cf-vpn.net" {
		t.Errorf("Expected trimmed & lowercased domain 'cf-vpn.net', got %s", domain2.Domain)
	}

	// Empty validation error
	_, err = domainUC.CreateDomain(context.Background(), "")
	if err == nil {
		t.Fatal("Expected validation error for empty domain, got nil")
	}
	var appErr *apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode != 400 {
		t.Errorf("Expected status 400 validation error, got: %v", err)
	}

	// Duplicate validation error
	_, err = domainUC.CreateDomain(context.Background(), "google.com")
	if err == nil {
		t.Fatal("Expected validation error for duplicate domain, got nil")
	}
	if !errors.As(err, &appErr) || appErr.StatusCode != 400 {
		t.Errorf("Expected status 400 validation error, got: %v", err)
	}
}

func TestGetAllDomains(t *testing.T) {
	mockRepo := &MockDomainRepository{}
	domainUC := NewDomainUseCase(mockRepo, dummyLogger{})

	_, _ = domainUC.CreateDomain(context.Background(), "domain1.com")
	_, _ = domainUC.CreateDomain(context.Background(), "domain2.com")

	list, err := domainUC.GetAllDomains(context.Background())
	if err != nil {
		t.Fatalf("GetAllDomains failed: %v", err)
	}

	if len(list) != 2 {
		t.Fatalf("Expected 2 domains, got %d", len(list))
	}
	if list[0].Domain != "domain2.com" || list[1].Domain != "domain1.com" {
		t.Errorf("Expected descending order, got: %s then %s", list[0].Domain, list[1].Domain)
	}
}

func TestDeleteDomain(t *testing.T) {
	mockRepo := &MockDomainRepository{}
	domainUC := NewDomainUseCase(mockRepo, dummyLogger{})

	domainEntry, _ := domainUC.CreateDomain(context.Background(), "todelete.com")
	cnt, _ := mockRepo.Count(context.Background())
	if cnt != 1 {
		t.Fatalf("Expected 1 domain in db, got %d", cnt)
	}

	err := domainUC.DeleteDomain(context.Background(), domainEntry.ID)
	if err != nil {
		t.Fatalf("DeleteDomain failed: %v", err)
	}

	cnt, _ = mockRepo.Count(context.Background())
	if cnt != 0 {
		t.Errorf("Expected 0 domains in db, got %d", cnt)
	}
}
