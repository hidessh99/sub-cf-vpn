package test

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/bug/domain"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/bug/usecase"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/pkg/apperror"
)

type MockBugRepository struct {
	db []domain.Bug
}

func (m *MockBugRepository) FindAll(ctx context.Context) ([]domain.Bug, error) {
	result := make([]domain.Bug, len(m.db))
	for i := range m.db {
		result[i] = m.db[len(m.db)-1-i]
	}
	return result, nil
}

func (m *MockBugRepository) FindByHostname(ctx context.Context, hostname string) (*domain.Bug, error) {
	for _, b := range m.db {
		if b.Hostname == hostname {
			return &b, nil
		}
	}
	return nil, nil
}

func (m *MockBugRepository) Create(ctx context.Context, bug *domain.Bug) error {
	bug.ID = uint(len(m.db) + 1)
	bug.CreatedAt = time.Now()
	m.db = append(m.db, *bug)
	return nil
}

func (m *MockBugRepository) Delete(ctx context.Context, id uint) error {
	var filtered []domain.Bug
	for _, b := range m.db {
		if b.ID != id {
			filtered = append(filtered, b)
		}
	}
	m.db = filtered
	return nil
}

func (m *MockBugRepository) BulkCreate(ctx context.Context, hostnames []string) (int64, error) {
	var count int64
	for _, h := range hostnames {
		clean := strings.ToLower(strings.TrimSpace(h))
		if clean != "" {
			existing, _ := m.FindByHostname(ctx, clean)
			if existing == nil {
				_ = m.Create(ctx, &domain.Bug{Hostname: clean, IsActive: true})
				count++
			}
		}
	}
	return count, nil
}

func (m *MockBugRepository) GetPublicList(ctx context.Context) ([]string, error) {
	var list []string
	for _, b := range m.db {
		if b.IsActive {
			list = append(list, b.Hostname)
		}
	}
	return list, nil
}

func (m *MockBugRepository) Count(ctx context.Context) (int64, error) {
	return int64(len(m.db)), nil
}


func TestCreateBug(t *testing.T) {
	mockRepo := &MockBugRepository{}
	bugUC := usecase.NewBugUseCase(mockRepo, dummyLogger{})

	// Success create
	bug, err := bugUC.CreateBug(context.Background(), "m.youtube.com")
	if err != nil {
		t.Fatalf("CreateBug returned unexpected error: %v", err)
	}
	if bug.Hostname != "m.youtube.com" {
		t.Errorf("Expected hostname 'm.youtube.com', got %s", bug.Hostname)
	}

	// Trim and lowercase test
	bug2, err := bugUC.CreateBug(context.Background(), "  BUG-HOST.id  ")
	if err != nil {
		t.Fatalf("CreateBug returned unexpected error: %v", err)
	}
	if bug2.Hostname != "bug-host.id" {
		t.Errorf("Expected trimmed & lowercased hostname 'bug-host.id', got %s", bug2.Hostname)
	}

	// Empty validation error
	_, err = bugUC.CreateBug(context.Background(), "")
	if err == nil {
		t.Fatal("Expected validation error for empty hostname, got nil")
	}
	var appErr *apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode != 400 {
		t.Errorf("Expected status 400 validation error, got: %v", err)
	}

	// Duplicate validation error
	_, err = bugUC.CreateBug(context.Background(), "m.youtube.com")
	if err == nil {
		t.Fatal("Expected validation error for duplicate hostname, got nil")
	}
	if !errors.As(err, &appErr) || appErr.StatusCode != 400 {
		t.Errorf("Expected status 400 validation error, got: %v", err)
	}
}

func TestGetAllBugs(t *testing.T) {
	mockRepo := &MockBugRepository{}
	bugUC := usecase.NewBugUseCase(mockRepo, dummyLogger{})

	_, _ = bugUC.CreateBug(context.Background(), "bug1.com")
	_, _ = bugUC.CreateBug(context.Background(), "bug2.com")

	list, err := bugUC.GetAllBugs(context.Background())
	if err != nil {
		t.Fatalf("GetAllBugs failed: %v", err)
	}

	if len(list) != 2 {
		t.Fatalf("Expected 2 bugs, got %d", len(list))
	}
	if list[0].Hostname != "bug2.com" || list[1].Hostname != "bug1.com" {
		t.Errorf("Expected descending order, got: %s then %s", list[0].Hostname, list[1].Hostname)
	}
}

func TestDeleteBug(t *testing.T) {
	mockRepo := &MockBugRepository{}
	bugUC := usecase.NewBugUseCase(mockRepo, dummyLogger{})

	bug, _ := bugUC.CreateBug(context.Background(), "bugtodelete.com")
	cnt, _ := mockRepo.Count(context.Background())
	if cnt != 1 {
		t.Fatalf("Expected 1 bug in db, got %d", cnt)
	}

	err := bugUC.DeleteBug(context.Background(), bug.ID)
	if err != nil {
		t.Fatalf("DeleteBug failed: %v", err)
	}

	cnt, _ = mockRepo.Count(context.Background())
	if cnt != 0 {
		t.Errorf("Expected 0 bugs in db, got %d", cnt)
	}
}
