package usecase

import (
	"context"
	"strings"
	"sync"

	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/infrastructure/config"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/module/proxy/domain"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/shared/port"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/pkg/apperror"
)

type ProxyUseCase interface {
	GetAllProxies(ctx context.Context, page, limit int, filters domain.ProxyFilters) ([]domain.Proxy, int64, error)
	CreateProxy(ctx context.Context, proxy *domain.Proxy) error
	UpdateProxy(ctx context.Context, id uint, proxy *domain.Proxy) (*domain.Proxy, error)
	DeleteProxy(ctx context.Context, id uint) error
	ImportFromJSON(ctx context.Context, list []domain.Proxy) (int64, error)
	GetPublicProxyList(ctx context.Context) ([]domain.Proxy, error)
	GetPublicProxyListGrouped(ctx context.Context) (map[string][]string, error)
	LookupGeoIP(ctx context.Context, ip string) (*domain.GeoIPResult, error)
	SyncHealthCheck(ctx context.Context)
	RunHealthCheckCycle(ctx context.Context)
	DeleteAllProxies(ctx context.Context) (int64, error)
}

type proxyUseCase struct {
	proxyRepo    domain.ProxyRepository
	proxyChecker domain.ProxyChecker
	geoIPService domain.GeoIPService
	cfg          *config.AppConfig
	log          port.Logger
	mu           sync.Mutex
	isChecking   bool
}

func NewProxyUseCase(
	proxyRepo domain.ProxyRepository,
	proxyChecker domain.ProxyChecker,
	geoIPService domain.GeoIPService,
	cfg *config.AppConfig,
	log port.Logger,
) ProxyUseCase {
	return &proxyUseCase{
		proxyRepo:    proxyRepo,
		proxyChecker: proxyChecker,
		geoIPService: geoIPService,
		cfg:          cfg,
		log:          log,
	}
}

// Implement domain.ProxyCounter port
func (u *proxyUseCase) Count(ctx context.Context) (int64, error) {
	return u.proxyRepo.Count(ctx)
}

func (u *proxyUseCase) GetAllProxies(ctx context.Context, page, limit int, filters domain.ProxyFilters) ([]domain.Proxy, int64, error) {
	u.log.Debug("Fetching proxies list", "ProxyUseCase")
	return u.proxyRepo.FindAll(ctx, page, limit, filters)
}

func (u *proxyUseCase) CreateProxy(ctx context.Context, proxy *domain.Proxy) error {
	if proxy.IP == "" {
		return apperror.NewValidationError("IP field is required")
	}
	if proxy.Proxy == "" {
		proxy.Proxy = proxy.IP
	}
	if proxy.Port == "" {
		proxy.Port = "443"
	}
	return u.proxyRepo.Create(ctx, proxy)
}

func (u *proxyUseCase) UpdateProxy(ctx context.Context, id uint, proxy *domain.Proxy) (*domain.Proxy, error) {
	existing, err := u.proxyRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, apperror.NewNotFoundError("Proxy not found")
	}

	if proxy.Proxy != "" {
		existing.Proxy = proxy.Proxy
	}
	if proxy.Port != "" {
		existing.Port = proxy.Port
	}
	existing.ProxyIP = proxy.ProxyIP
	if proxy.IP != "" {
		existing.IP = proxy.IP
	}
	if proxy.Latency != 0 {
		existing.Latency = proxy.Latency
	}
	if proxy.ASN != nil {
		existing.ASN = proxy.ASN
	}
	if proxy.ASOrganization != nil {
		existing.ASOrganization = proxy.ASOrganization
	}
	if proxy.Colo != nil {
		existing.Colo = proxy.Colo
	}
	if proxy.Country != nil {
		existing.Country = proxy.Country
	}
	if proxy.City != nil {
		existing.City = proxy.City
	}
	if proxy.Region != nil {
		existing.Region = proxy.Region
	}
	if proxy.PostalCode != nil {
		existing.PostalCode = proxy.PostalCode
	}
	if proxy.Latitude != nil {
		existing.Latitude = proxy.Latitude
	}
	if proxy.Longitude != nil {
		existing.Longitude = proxy.Longitude
	}
	existing.IsActive = proxy.IsActive

	err = u.proxyRepo.Update(ctx, id, existing)
	if err != nil {
		return nil, err
	}
	return existing, nil
}

func (u *proxyUseCase) DeleteProxy(ctx context.Context, id uint) error {
	existing, err := u.proxyRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return apperror.NewNotFoundError("Proxy not found")
	}
	return u.proxyRepo.Delete(ctx, id)
}

func (u *proxyUseCase) DeleteAllProxies(ctx context.Context) (int64, error) {
	u.log.Warn("Deleting all proxies from database...", "ProxyUseCase")
	return u.proxyRepo.DeleteAll(ctx)
}

func (u *proxyUseCase) ImportFromJSON(ctx context.Context, list []domain.Proxy) (int64, error) {
	if len(list) == 0 {
		return 0, nil
	}

	existingList, _, err := u.proxyRepo.FindAll(ctx, 1, 1000000, domain.ProxyFilters{})
	if err != nil {
		return 0, err
	}

	existingMap := make(map[string]bool)
	for _, p := range existingList {
		key := strings.TrimSpace(p.IP) + ":" + strings.TrimSpace(p.Port)
		existingMap[key] = true
	}

	seenInImport := make(map[string]bool)
	var proxies []domain.Proxy
	for _, item := range list {
		if item.IP == "" {
			return 0, apperror.NewValidationError("Missing required field 'ip' in import items")
		}

		portVal := "443"
		if item.Port != "" {
			portVal = item.Port
		}

		key := strings.TrimSpace(item.IP) + ":" + strings.TrimSpace(portVal)

		if existingMap[key] {
			continue
		}
		if seenInImport[key] {
			continue
		}
		seenInImport[key] = true

		if item.Proxy == "" {
			item.Proxy = item.IP
		}
		if item.Port == "" {
			item.Port = "443"
		}
		item.IsActive = true

		proxies = append(proxies, item)
	}

	if len(proxies) == 0 {
		return 0, nil
	}

	return u.proxyRepo.BulkCreate(ctx, proxies)
}

func (u *proxyUseCase) GetPublicProxyList(ctx context.Context) ([]domain.Proxy, error) {
	return u.proxyRepo.GetPublicList(ctx)
}

func (u *proxyUseCase) GetPublicProxyListGrouped(ctx context.Context) (map[string][]string, error) {
	list, err := u.proxyRepo.GetPublicList(ctx)
	if err != nil {
		return nil, err
	}

	grouped := make(map[string][]string)
	for _, item := range list {
		country := "UNK"
		if item.Country != nil && *item.Country != "" {
			country = strings.ToUpper(*item.Country)
		}

		proxyStr := item.Proxy + ":" + item.Port
		grouped[country] = append(grouped[country], proxyStr)
	}

	return grouped, nil
}

func (u *proxyUseCase) LookupGeoIP(ctx context.Context, ip string) (*domain.GeoIPResult, error) {
	return u.geoIPService.Lookup(ip)
}
