package usecase

import (
	"strings"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/repository"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/apperror"
)

type DomainUseCase interface {
	GetAllDomains() ([]entity.DomainEntry, error)
	CreateDomain(domainName string) (*entity.DomainEntry, error)
	DeleteDomain(id uint) error
	GetPublicDomainList() ([]string, error)
	ImportFromJSON(list []string) (int64, error)
}

type domainUseCaseImpl struct {
	domainRepo repository.DomainRepository
}

func NewDomainUseCase(domainRepo repository.DomainRepository) DomainUseCase {
	return &domainUseCaseImpl{domainRepo: domainRepo}
}

func (u *domainUseCaseImpl) GetAllDomains() ([]entity.DomainEntry, error) {
	return u.domainRepo.FindAll()
}

func (u *domainUseCaseImpl) CreateDomain(domainName string) (*entity.DomainEntry, error) {
	if domainName == "" {
		return nil, apperror.NewValidationError("Domain name is required")
	}

	cleanDomain := strings.ToLower(strings.TrimSpace(domainName))

	// Check duplication
	existing, err := u.domainRepo.FindByDomain(cleanDomain)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, apperror.NewValidationError("Domain '" + cleanDomain + "' already exists")
	}

	entry := &entity.DomainEntry{
		Domain:   cleanDomain,
		IsActive: true,
	}

	err = u.domainRepo.Create(entry)
	if err != nil {
		return nil, err
	}

	return entry, nil
}

func (u *domainUseCaseImpl) DeleteDomain(id uint) error {
	// GORM Delete doesn't error out if row doesn't exist, it just returns 0 rows affected.
	// But let's keep it simple and just run delete.
	return u.domainRepo.Delete(id)
}

func (u *domainUseCaseImpl) GetPublicDomainList() ([]string, error) {
	return u.domainRepo.GetPublicList()
}

func (u *domainUseCaseImpl) ImportFromJSON(list []string) (int64, error) {
	return u.domainRepo.BulkCreate(list)
}
