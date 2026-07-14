package usecase

import (
	"context"
	"fmt"
	"strings"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/bug/domain"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/shared/port"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/pkg/apperror"
)

type BugUseCase interface {
	GetAllBugs(ctx context.Context) ([]domain.Bug, error)
	CreateBug(ctx context.Context, hostname string) (*domain.Bug, error)
	DeleteBug(ctx context.Context, id uint) error
	GetPublicBugList(ctx context.Context) ([]string, error)
	ImportFromJSON(ctx context.Context, list []string) (int64, error)
}

type bugUseCase struct {
	bugRepo domain.BugRepository
	log     port.Logger
}

func NewBugUseCase(bugRepo domain.BugRepository, log port.Logger) BugUseCase {
	return &bugUseCase{
		bugRepo: bugRepo,
		log:     log,
	}
}

// Implement bug/port.BugCounter
func (u *bugUseCase) Count(ctx context.Context) (int64, error) {
	return u.bugRepo.Count(ctx)
}

func (u *bugUseCase) GetAllBugs(ctx context.Context) ([]domain.Bug, error) {
	bugs, err := u.bugRepo.FindAll(ctx)
	if err != nil {
		u.log.Error("Database error fetching bugs list", err, "BugUseCase")
		return nil, err
	}
	return bugs, nil
}

func (u *bugUseCase) CreateBug(ctx context.Context, hostname string) (*domain.Bug, error) {
	if hostname == "" {
		return nil, apperror.NewValidationError("Hostname is required")
	}

	cleanHostname := strings.ToLower(strings.TrimSpace(hostname))

	existing, err := u.bugRepo.FindByHostname(ctx, cleanHostname)
	if err != nil {
		u.log.Error(fmt.Sprintf("Database error checking duplicate bug hostname: %s", cleanHostname), err, "BugUseCase")
		return nil, err
	}
	if existing != nil {
		u.log.Warn(fmt.Sprintf("Create bug failed - duplicate: %s", cleanHostname), "BugUseCase")
		return nil, apperror.NewValidationError("Bug hostname '" + cleanHostname + "' already exists")
	}

	bug := &domain.Bug{
		Hostname: cleanHostname,
		IsActive: true,
	}

	err = u.bugRepo.Create(ctx, bug)
	if err != nil {
		u.log.Error(fmt.Sprintf("Database error creating bug: %s", cleanHostname), err, "BugUseCase")
		return nil, err
	}

	u.log.Info(fmt.Sprintf("Successfully created bug: %s", cleanHostname), "BugUseCase")
	return bug, nil
}

func (u *bugUseCase) DeleteBug(ctx context.Context, id uint) error {
	err := u.bugRepo.Delete(ctx, id)
	if err != nil {
		u.log.Error(fmt.Sprintf("Database error deleting bug with id=%d", id), err, "BugUseCase")
		return err
	}
	u.log.Info(fmt.Sprintf("Successfully deleted bug with id=%d", id), "BugUseCase")
	return nil
}

func (u *bugUseCase) GetPublicBugList(ctx context.Context) ([]string, error) {
	list, err := u.bugRepo.GetPublicList(ctx)
	if err != nil {
		u.log.Error("Database error fetching public bug list", err, "BugUseCase")
		return nil, err
	}
	return list, nil
}

func (u *bugUseCase) ImportFromJSON(ctx context.Context, list []string) (int64, error) {
	count, err := u.bugRepo.BulkCreate(ctx, list)
	if err != nil {
		u.log.Error("Database error during bulk bugs import", err, "BugUseCase")
		return 0, err
	}
	u.log.Info(fmt.Sprintf("Successfully imported %d bugs from JSON", count), "BugUseCase")
	return count, nil
}
