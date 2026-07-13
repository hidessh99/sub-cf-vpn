package test

import (
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/apperror"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/usecase"
)

type MockDomainRepository struct {
	db []entity.DomainEntry
}

func (m *MockDomainRepository) FindAll() ([]entity.DomainEntry, error) {
	// Descending order list
	result := make([]entity.DomainEntry, len(m.db))
	for i := range m.db {
		result[i] = m.db[len(m.db)-1-i]
	}
	return result, nil
}

func (m *MockDomainRepository) FindByDomain(domain string) (*entity.DomainEntry, error) {
	for _, d := range m.db {
		if d.Domain == domain {
			return &d, nil
		}
	}
	return nil, nil
}

func (m *MockDomainRepository) Create(domain *entity.DomainEntry) error {
	domain.ID = uint(len(m.db) + 1)
	domain.CreatedAt = time.Now()
	m.db = append(m.db, *domain)
	return nil
}

func (m *MockDomainRepository) Delete(id uint) error {
	var filtered []entity.DomainEntry
	for _, d := range m.db {
		if d.ID != id {
			filtered = append(filtered, d)
		}
	}
	m.db = filtered
	return nil
}

func (m *MockDomainRepository) BulkCreate(domains []string) (int64, error) {
	var count int64
	for _, d := range domains {
		clean := strings.ToLower(strings.TrimSpace(d))
		if clean != "" {
			existing, _ := m.FindByDomain(clean)
			if existing == nil {
				_ = m.Create(&entity.DomainEntry{Domain: clean, IsActive: true})
				count++
			}
		}
	}
	return count, nil
}

func (m *MockDomainRepository) GetPublicList() ([]string, error) {
	var list []string
	for _, d := range m.db {
		if d.IsActive {
			list = append(list, d.Domain)
		}
	}
	return list, nil
}

func (m *MockDomainRepository) Count() (int64, error) {
	return int64(len(m.db)), nil
}

func TestCreateDomain(t *testing.T) {
	mockRepo := &MockDomainRepository{}
	authUC := usecase.NewDomainUseCase(mockRepo, testLogger())

	// Success create
	domain, err := authUC.CreateDomain("google.com")
	if err != nil {
		t.Fatalf("CreateDomain returned unexpected error: %v", err)
	}
	if domain.Domain != "google.com" {
		t.Errorf("Expected domain 'google.com', got %s", domain.Domain)
	}

	// Trim and lowercase test
	domain2, err := authUC.CreateDomain("  CF-vPN.Net  ")
	if err != nil {
		t.Fatalf("CreateDomain returned unexpected error: %v", err)
	}
	if domain2.Domain != "cf-vpn.net" {
		t.Errorf("Expected trimmed & lowercased domain 'cf-vpn.net', got %s", domain2.Domain)
	}

	// Empty validation error
	_, err = authUC.CreateDomain("")
	if err == nil {
		t.Fatal("Expected validation error for empty domain, got nil")
	}
	var appErr *apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode != 400 {
		t.Errorf("Expected status 400 validation error, got: %v", err)
	}

	// Duplicate validation error
	_, err = authUC.CreateDomain("google.com")
	if err == nil {
		t.Fatal("Expected validation error for duplicate domain, got nil")
	}
	if !errors.As(err, &appErr) || appErr.StatusCode != 400 {
		t.Errorf("Expected status 400 validation error, got: %v", err)
	}
}

func TestGetAllDomains(t *testing.T) {
	mockRepo := &MockDomainRepository{}
	authUC := usecase.NewDomainUseCase(mockRepo, testLogger())

	_, _ = authUC.CreateDomain("domain1.com")
	_, _ = authUC.CreateDomain("domain2.com")

	list, err := authUC.GetAllDomains()
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
	authUC := usecase.NewDomainUseCase(mockRepo, testLogger())

	domain, _ := authUC.CreateDomain("todelete.com")
	cnt, _ := mockRepo.Count()
	if cnt != 1 {
		t.Fatalf("Expected 1 domain in db, got %d", cnt)
	}

	err := authUC.DeleteDomain(domain.ID)
	if err != nil {
		t.Fatalf("DeleteDomain failed: %v", err)
	}

	cnt, _ = mockRepo.Count()
	if cnt != 0 {
		t.Errorf("Expected 0 domains in db, got %d", cnt)
	}
}

func TestDomainImportFromJSON(t *testing.T) {
	mockRepo := &MockDomainRepository{}
	authUC := usecase.NewDomainUseCase(mockRepo, testLogger())

	count, err := authUC.ImportFromJSON([]string{"abc.com", "xyz.net", "  ABC.COM  "})
	if err != nil {
		t.Fatalf("ImportFromJSON failed: %v", err)
	}

	if count != 2 {
		t.Errorf("Expected 2 unique imported domains, got %d", count)
	}

	cnt, _ := mockRepo.Count()
	if cnt != 2 {
		t.Errorf("Expected repository size 2, got %d", cnt)
	}
}

func TestGetPublicDomainList(t *testing.T) {
	mockRepo := &MockDomainRepository{}
	authUC := usecase.NewDomainUseCase(mockRepo, testLogger())

	_, _ = authUC.CreateDomain("one.com")
	_, _ = authUC.CreateDomain("two.net")

	list, err := authUC.GetPublicDomainList()
	if err != nil {
		t.Fatalf("GetPublicDomainList failed: %v", err)
	}

	if len(list) != 2 || list[0] != "one.com" || list[1] != "two.net" {
		t.Errorf("Expected public domain strings ['one.com', 'two.net'], got %v", list)
	}
}
