package usecase

import (
	"fmt"
	"strings"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/repository"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/logger"
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
	log        *logger.LogrusLogger
}

func NewDomainUseCase(domainRepo repository.DomainRepository, log *logger.LogrusLogger) DomainUseCase {
	return &domainUseCaseImpl{
		domainRepo: domainRepo,
		log:        log,
	}
}

func (u *domainUseCaseImpl) GetAllDomains() ([]entity.DomainEntry, error) {
	domains, err := u.domainRepo.FindAll()
	if err != nil {
		u.log.Error("Database error during Domain list fetch", err, "DomainUseCase")
		return nil, err
	}
	return domains, nil
}

func (u *domainUseCaseImpl) CreateDomain(domainName string) (*entity.DomainEntry, error) {
	if domainName == "" {
		return nil, apperror.NewValidationError("Domain name is required")
	}

	cleanDomain := strings.ToLower(strings.TrimSpace(domainName))

	// Check duplication
	existing, err := u.domainRepo.FindByDomain(cleanDomain)
	if err != nil {
		u.log.Error(fmt.Sprintf("Database error checking duplicate domain: %s", cleanDomain), err, "DomainUseCase")
		return nil, err
	}
	if existing != nil {
		u.log.Warn(fmt.Sprintf("Create domain failed - duplicate: %s", cleanDomain), "DomainUseCase")
		return nil, apperror.NewValidationError("Domain '" + cleanDomain + "' already exists")
	}

	entry := &entity.DomainEntry{
		Domain:   cleanDomain,
		IsActive: true,
	}

	err = u.domainRepo.Create(entry)
	if err != nil {
		u.log.Error(fmt.Sprintf("Database error creating domain: %s", cleanDomain), err, "DomainUseCase")
		return nil, err
	}

	u.log.Info(fmt.Sprintf("Successfully created domain: %s", cleanDomain), "DomainUseCase")
	return entry, nil
}

func (u *domainUseCaseImpl) DeleteDomain(id uint) error {
	err := u.domainRepo.Delete(id)
	if err != nil {
		u.log.Error(fmt.Sprintf("Database error deleting domain with id=%d", id), err, "DomainUseCase")
		return err
	}
	u.log.Info(fmt.Sprintf("Successfully deleted domain with id=%d", id), "DomainUseCase")
	return nil
}

func (u *domainUseCaseImpl) GetPublicDomainList() ([]string, error) {
	list, err := u.domainRepo.GetPublicList()
	if err != nil {
		u.log.Error("Database error fetching public domain list", err, "DomainUseCase")
		return nil, err
	}
	return list, nil
}

func (u *domainUseCaseImpl) ImportFromJSON(list []string) (int64, error) {
	count, err := u.domainRepo.BulkCreate(list)
	if err != nil {
		u.log.Error("Database error during bulk domains import", err, "DomainUseCase")
		return 0, err
	}
	u.log.Info(fmt.Sprintf("Successfully imported %d domains from JSON", count), "DomainUseCase")
	return count, nil
}
