package usecase

import (
	"fmt"
	"strings"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/repository"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/logger"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/apperror"
)

type BugUseCase interface {
	GetAllBugs() ([]entity.Bug, error)
	CreateBug(hostname string) (*entity.Bug, error)
	DeleteBug(id uint) error
	GetPublicBugList() ([]string, error)
	ImportFromJSON(list []string) (int64, error)
}

type bugUseCaseImpl struct {
	bugRepo repository.BugRepository
	log     *logger.LogrusLogger
}

func NewBugUseCase(bugRepo repository.BugRepository, log *logger.LogrusLogger) BugUseCase {
	return &bugUseCaseImpl{
		bugRepo: bugRepo,
		log:     log,
	}
}

func (u *bugUseCaseImpl) GetAllBugs() ([]entity.Bug, error) {
	bugs, err := u.bugRepo.FindAll()
	if err != nil {
		u.log.Error("Database error fetching bugs list", err, "BugUseCase")
		return nil, err
	}
	return bugs, nil
}

func (u *bugUseCaseImpl) CreateBug(hostname string) (*entity.Bug, error) {
	if hostname == "" {
		return nil, apperror.NewValidationError("Hostname is required")
	}

	cleanHostname := strings.ToLower(strings.TrimSpace(hostname))

	// Check duplication
	existing, err := u.bugRepo.FindByHostname(cleanHostname)
	if err != nil {
		u.log.Error(fmt.Sprintf("Database error checking duplicate bug hostname: %s", cleanHostname), err, "BugUseCase")
		return nil, err
	}
	if existing != nil {
		u.log.Warn(fmt.Sprintf("Create bug failed - duplicate: %s", cleanHostname), "BugUseCase")
		return nil, apperror.NewValidationError("Bug hostname '" + cleanHostname + "' already exists")
	}

	bug := &entity.Bug{
		Hostname: cleanHostname,
		IsActive: true,
	}

	err = u.bugRepo.Create(bug)
	if err != nil {
		u.log.Error(fmt.Sprintf("Database error creating bug: %s", cleanHostname), err, "BugUseCase")
		return nil, err
	}

	u.log.Info(fmt.Sprintf("Successfully created bug: %s", cleanHostname), "BugUseCase")
	return bug, nil
}

func (u *bugUseCaseImpl) DeleteBug(id uint) error {
	err := u.bugRepo.Delete(id)
	if err != nil {
		u.log.Error(fmt.Sprintf("Database error deleting bug with id=%d", id), err, "BugUseCase")
		return err
	}
	u.log.Info(fmt.Sprintf("Successfully deleted bug with id=%d", id), "BugUseCase")
	return nil
}

func (u *bugUseCaseImpl) GetPublicBugList() ([]string, error) {
	list, err := u.bugRepo.GetPublicList()
	if err != nil {
		u.log.Error("Database error fetching public bug list", err, "BugUseCase")
		return nil, err
	}
	return list, nil
}

func (u *bugUseCaseImpl) ImportFromJSON(list []string) (int64, error) {
	count, err := u.bugRepo.BulkCreate(list)
	if err != nil {
		u.log.Error("Database error during bulk bugs import", err, "BugUseCase")
		return 0, err
	}
	u.log.Info(fmt.Sprintf("Successfully imported %d bugs from JSON", count), "BugUseCase")
	return count, nil
}
