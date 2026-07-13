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

type MockBugRepository struct {
	db []entity.Bug
}

func (m *MockBugRepository) FindAll() ([]entity.Bug, error) {
	// Return list in descending ID order
	result := make([]entity.Bug, len(m.db))
	for i := range m.db {
		result[i] = m.db[len(m.db)-1-i]
	}
	return result, nil
}

func (m *MockBugRepository) FindByHostname(hostname string) (*entity.Bug, error) {
	for _, b := range m.db {
		if b.Hostname == hostname {
			return &b, nil
		}
	}
	return nil, nil
}

func (m *MockBugRepository) Create(bug *entity.Bug) error {
	bug.ID = uint(len(m.db) + 1)
	bug.CreatedAt = time.Now()
	m.db = append(m.db, *bug)
	return nil
}

func (m *MockBugRepository) Delete(id uint) error {
	var filtered []entity.Bug
	for _, b := range m.db {
		if b.ID != id {
			filtered = append(filtered, b)
		}
	}
	m.db = filtered
	return nil
}

func (m *MockBugRepository) BulkCreate(hostnames []string) (int64, error) {
	var count int64
	for _, h := range hostnames {
		clean := strings.ToLower(strings.TrimSpace(h))
		if clean != "" {
			existing, _ := m.FindByHostname(clean)
			if existing == nil {
				_ = m.Create(&entity.Bug{Hostname: clean, IsActive: true})
				count++
			}
		}
	}
	return count, nil
}

func (m *MockBugRepository) GetPublicList() ([]string, error) {
	var list []string
	for _, b := range m.db {
		if b.IsActive {
			list = append(list, b.Hostname)
		}
	}
	return list, nil
}

func (m *MockBugRepository) Count() (int64, error) {
	return int64(len(m.db)), nil
}

func TestCreateBug(t *testing.T) {
	mockRepo := &MockBugRepository{}
	authUC := usecase.NewBugUseCase(mockRepo, testLogger())

	// Success create
	bug, err := authUC.CreateBug("m.youtube.com")
	if err != nil {
		t.Fatalf("CreateBug returned unexpected error: %v", err)
	}
	if bug.Hostname != "m.youtube.com" {
		t.Errorf("Expected hostname 'm.youtube.com', got %s", bug.Hostname)
	}

	// Trim and lowercase test
	bug2, err := authUC.CreateBug("  BUG-HOST.id  ")
	if err != nil {
		t.Fatalf("CreateBug returned unexpected error: %v", err)
	}
	if bug2.Hostname != "bug-host.id" {
		t.Errorf("Expected trimmed & lowercased hostname 'bug-host.id', got %s", bug2.Hostname)
	}

	// Empty validation error
	_, err = authUC.CreateBug("")
	if err == nil {
		t.Fatal("Expected validation error for empty hostname, got nil")
	}
	var appErr *apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode != 400 {
		t.Errorf("Expected status 400 validation error, got: %v", err)
	}

	// Duplicate validation error
	_, err = authUC.CreateBug("m.youtube.com")
	if err == nil {
		t.Fatal("Expected validation error for duplicate hostname, got nil")
	}
	if !errors.As(err, &appErr) || appErr.StatusCode != 400 {
		t.Errorf("Expected status 400 validation error, got: %v", err)
	}
}

func TestGetAllBugs(t *testing.T) {
	mockRepo := &MockBugRepository{}
	authUC := usecase.NewBugUseCase(mockRepo, testLogger())

	_, _ = authUC.CreateBug("bug1.com")
	_, _ = authUC.CreateBug("bug2.com")

	list, err := authUC.GetAllBugs()
	if err != nil {
		t.Fatalf("GetAllBugs failed: %v", err)
	}

	if len(list) != 2 {
		t.Fatalf("Expected 2 bugs, got %d", len(list))
	}
	// Descending ID order assertion
	if list[0].Hostname != "bug2.com" || list[1].Hostname != "bug1.com" {
		t.Errorf("Expected descending order, got: %s then %s", list[0].Hostname, list[1].Hostname)
	}
}

func TestDeleteBug(t *testing.T) {
	mockRepo := &MockBugRepository{}
	authUC := usecase.NewBugUseCase(mockRepo, testLogger())

	bug, _ := authUC.CreateBug("bugtodelete.com")
	cnt, _ := mockRepo.Count()
	if cnt != 1 {
		t.Fatalf("Expected 1 bug in db, got %d", cnt)
	}

	err := authUC.DeleteBug(bug.ID)
	if err != nil {
		t.Fatalf("DeleteBug failed: %v", err)
	}

	cnt, _ = mockRepo.Count()
	if cnt != 0 {
		t.Errorf("Expected 0 bugs in db, got %d", cnt)
	}
}

func TestBugImportFromJSON(t *testing.T) {
	mockRepo := &MockBugRepository{}
	authUC := usecase.NewBugUseCase(mockRepo, testLogger())

	count, err := authUC.ImportFromJSON([]string{"bug1.com", "bug2.net", "  BUG1.COM  "})
	if err != nil {
		t.Fatalf("ImportFromJSON failed: %v", err)
	}

	if count != 2 {
		t.Errorf("Expected 2 unique imported hosts, got %d", count)
	}

	cnt, _ := mockRepo.Count()
	if cnt != 2 {
		t.Errorf("Expected repository size 2, got %d", cnt)
	}
}

func TestGetPublicBugList(t *testing.T) {
	mockRepo := &MockBugRepository{}
	authUC := usecase.NewBugUseCase(mockRepo, testLogger())

	_, _ = authUC.CreateBug("line.me")
	_, _ = authUC.CreateBug("whatsapp.net")

	list, err := authUC.GetPublicBugList()
	if err != nil {
		t.Fatalf("GetPublicBugList failed: %v", err)
	}

	if len(list) != 2 || list[0] != "line.me" || list[1] != "whatsapp.net" {
		t.Errorf("Expected public bug strings ['line.me', 'whatsapp.net'], got %v", list)
	}
}

