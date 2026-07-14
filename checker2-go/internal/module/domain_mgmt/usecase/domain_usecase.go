package usecase

import (
	"context"
	"fmt"
	"strings"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/domain_mgmt/domain"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/shared/port"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/pkg/apperror"
)

type DomainUseCase interface {
	GetAllDomains(ctx context.Context) ([]domain.DomainEntry, error)
	CreateDomain(ctx context.Context, domainName string) (*domain.DomainEntry, error)
	DeleteDomain(ctx context.Context, id uint) error
	GetPublicDomainList(ctx context.Context) ([]string, error)
	ImportFromJSON(ctx context.Context, list []string) (int64, error)
}

type domainUseCase struct {
	domainRepo domain.DomainRepository
	log        port.Logger
}

func NewDomainUseCase(domainRepo domain.DomainRepository, log port.Logger) DomainUseCase {
	return &domainUseCase{
		domainRepo: domainRepo,
		log:        log,
	}
}

// Implement domain_mgmt/port.DomainCounter
func (u *domainUseCase) Count(ctx context.Context) (int64, error) {
	return u.domainRepo.Count(ctx)
}

func (u *domainUseCase) GetAllDomains(ctx context.Context) ([]domain.DomainEntry, error) {
	domains, err := u.domainRepo.FindAll(ctx)
	if err != nil {
		u.log.Error("Database error during Domain list fetch", err, "DomainUseCase")
		return nil, err
	}
	return domains, nil
}

func (u *domainUseCase) CreateDomain(ctx context.Context, domainName string) (*domain.DomainEntry, error) {
	if domainName == "" {
		return nil, apperror.NewValidationError("Domain name is required")
	}

	cleanDomain := strings.ToLower(strings.TrimSpace(domainName))

	existing, err := u.domainRepo.FindByDomain(ctx, cleanDomain)
	if err != nil {
		u.log.Error(fmt.Sprintf("Database error checking duplicate domain: %s", cleanDomain), err, "DomainUseCase")
		return nil, err
	}
	if existing != nil {
		u.log.Warn(fmt.Sprintf("Create domain failed - duplicate: %s", cleanDomain), "DomainUseCase")
		return nil, apperror.NewValidationError("Domain '" + cleanDomain + "' already exists")
	}

	entry := &domain.DomainEntry{
		Domain:   cleanDomain,
		IsActive: true,
	}

	err = u.domainRepo.Create(ctx, entry)
	if err != nil {
		u.log.Error(fmt.Sprintf("Database error creating domain: %s", cleanDomain), err, "DomainUseCase")
		return nil, err
	}

	u.log.Info(fmt.Sprintf("Successfully created domain: %s", cleanDomain), "DomainUseCase")
	return entry, nil
}

func (u *domainUseCase) DeleteDomain(ctx context.Context, id uint) error {
	err := u.domainRepo.Delete(ctx, id)
	if err != nil {
		u.log.Error(fmt.Sprintf("Database error deleting domain with id=%d", id), err, "DomainUseCase")
		return err
	}
	u.log.Info(fmt.Sprintf("Successfully deleted domain with id=%d", id), "DomainUseCase")
	return nil
}

func (u *domainUseCase) GetPublicDomainList(ctx context.Context) ([]string, error) {
	list, err := u.domainRepo.GetPublicList(ctx)
	if err != nil {
		u.log.Error("Database error fetching public domain list", err, "DomainUseCase")
		return nil, err
	}
	return list, nil
}

func (u *domainUseCase) ImportFromJSON(ctx context.Context, list []string) (int64, error) {
	count, err := u.domainRepo.BulkCreate(ctx, list)
	if err != nil {
		u.log.Error("Database error during bulk domains import", err, "DomainUseCase")
		return 0, err
	}
	u.log.Info(fmt.Sprintf("Successfully imported %d domains from JSON", count), "DomainUseCase")
	return count, nil
}
