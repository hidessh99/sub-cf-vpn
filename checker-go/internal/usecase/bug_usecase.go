package usecase

import (
	"strings"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/repository"
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
}

func NewBugUseCase(bugRepo repository.BugRepository) BugUseCase {
	return &bugUseCaseImpl{bugRepo: bugRepo}
}

func (u *bugUseCaseImpl) GetAllBugs() ([]entity.Bug, error) {
	return u.bugRepo.FindAll()
}

func (u *bugUseCaseImpl) CreateBug(hostname string) (*entity.Bug, error) {
	if hostname == "" {
		return nil, apperror.NewValidationError("Hostname is required")
	}

	cleanHostname := strings.ToLower(strings.TrimSpace(hostname))

	// Check duplication
	existing, err := u.bugRepo.FindByHostname(cleanHostname)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, apperror.NewValidationError("Bug hostname '" + cleanHostname + "' already exists")
	}

	bug := &entity.Bug{
		Hostname: cleanHostname,
		IsActive: true,
	}

	err = u.bugRepo.Create(bug)
	if err != nil {
		return nil, err
	}

	return bug, nil
}

func (u *bugUseCaseImpl) DeleteBug(id uint) error {
	return u.bugRepo.Delete(id)
}

func (u *bugUseCaseImpl) GetPublicBugList() ([]string, error) {
	return u.bugRepo.GetPublicList()
}

func (u *bugUseCaseImpl) ImportFromJSON(list []string) (int64, error) {
	return u.bugRepo.BulkCreate(list)
}
