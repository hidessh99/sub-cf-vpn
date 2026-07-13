package usecase

import (
	"strconv"
	"strings"
	"sync"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/config"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/delivery/http/dto"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/repository"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/logger"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/apperror"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/checker"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/geoip"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/ipvalidator"
)

type ProxyUseCase interface {
	GetAllProxies(page, limit int, filters repository.ProxyFilters) ([]entity.Proxy, int64, error)
	CreateProxy(req dto.CreateProxyRequest) (*entity.Proxy, error)
	UpdateProxy(id uint, req dto.UpdateProxyRequest) (*entity.Proxy, error)
	DeleteProxy(id uint) error
	ImportFromJSON(list []dto.CreateProxyRequest) (int64, error)
	GetPublicProxyList() ([]dto.PublicProxyItem, error)
	GetPublicProxyListGrouped() (map[string][]string, error)
	LookupGeoIP(ip string) (*geoip.GeoIPResult, error)
	SyncHealthCheck()
	RunHealthCheckCycle()
}

type proxyUseCaseImpl struct {
	proxyRepo    repository.ProxyRepository
	geoIPService geoip.IGeoIPService
	cfg          *config.AppConfig
	log          *logger.LogrusLogger
	mu           sync.Mutex
	isChecking   bool
}

func NewProxyUseCase(
	proxyRepo repository.ProxyRepository,
	geoIPService geoip.IGeoIPService,
	cfg *config.AppConfig,
	log *logger.LogrusLogger,
) ProxyUseCase {
	return &proxyUseCaseImpl{
		proxyRepo:    proxyRepo,
		geoIPService: geoIPService,
		cfg:          cfg,
		log:          log,
	}
}

func (u *proxyUseCaseImpl) GetAllProxies(page, limit int, filters repository.ProxyFilters) ([]entity.Proxy, int64, error) {
	u.log.Debug("Fetching proxies list", "ProxyUseCase")
	return u.proxyRepo.FindAll(page, limit, filters)
}

func (u *proxyUseCaseImpl) CreateProxy(req dto.CreateProxyRequest) (*entity.Proxy, error) {
	if req.IP == "" {
		return nil, apperror.NewValidationError("IP field is required")
	}

	proxyVal := req.IP
	if req.Proxy != nil && *req.Proxy != "" {
		proxyVal = *req.Proxy
	}

	portVal := "443"
	if req.Port != nil && *req.Port != "" {
		portVal = *req.Port
	}

	proxyIPVal := true
	if req.ProxyIP != nil {
		proxyIPVal = *req.ProxyIP
	}

	latencyVal := 0
	if req.Latency != nil {
		latencyVal = *req.Latency
	}

	isActiveVal := true
	if req.IsActive != nil {
		isActiveVal = *req.IsActive
	}

	// Resolve camelCase / snake_case fields
	asOrg := req.ASOrganization
	if asOrg == nil {
		asOrg = req.ASOrgSnake
	}

	postal := req.PostalCode
	if postal == nil {
		postal = req.PostalCodeSnake
	}

	proxy := &entity.Proxy{
		Proxy:          proxyVal,
		Port:           portVal,
		ProxyIP:        proxyIPVal,
		IP:             req.IP,
		Latency:        latencyVal,
		ASN:            req.ASN,
		ASOrganization: asOrg,
		Colo:           req.Colo,
		Country:        req.Country,
		City:           req.City,
		Region:         req.Region,
		PostalCode:     postal,
		Latitude:       req.Latitude,
		Longitude:      req.Longitude,
		IsActive:       isActiveVal,
	}

	err := u.proxyRepo.Create(proxy)
	if err != nil {
		return nil, err
	}

	return proxy, nil
}

func (u *proxyUseCaseImpl) UpdateProxy(id uint, req dto.UpdateProxyRequest) (*entity.Proxy, error) {
	existing, err := u.proxyRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if existing == nil {
		return nil, apperror.NewNotFoundError("Proxy not found")
	}

	if req.Proxy != nil {
		existing.Proxy = *req.Proxy
	}
	if req.Port != nil {
		existing.Port = *req.Port
	}
	if req.ProxyIP != nil {
		existing.ProxyIP = *req.ProxyIP
	}
	if req.IP != nil {
		existing.IP = *req.IP
	}
	if req.Latency != nil {
		existing.Latency = *req.Latency
	}
	if req.ASN != nil {
		existing.ASN = req.ASN
	}

	if req.ASOrganization != nil {
		existing.ASOrganization = req.ASOrganization
	} else if req.ASOrgSnake != nil {
		existing.ASOrganization = req.ASOrgSnake
	}

	if req.Colo != nil {
		existing.Colo = req.Colo
	}
	if req.Country != nil {
		existing.Country = req.Country
	}
	if req.City != nil {
		existing.City = req.City
	}
	if req.Region != nil {
		existing.Region = req.Region
	}

	if req.PostalCode != nil {
		existing.PostalCode = req.PostalCode
	} else if req.PostalCodeSnake != nil {
		existing.PostalCode = req.PostalCodeSnake
	}

	if req.Latitude != nil {
		existing.Latitude = req.Latitude
	}
	if req.Longitude != nil {
		existing.Longitude = req.Longitude
	}
	if req.IsActive != nil {
		existing.IsActive = *req.IsActive
	}

	err = u.proxyRepo.Update(id, existing)
	if err != nil {
		return nil, err
	}

	return existing, nil
}

func (u *proxyUseCaseImpl) DeleteProxy(id uint) error {
	existing, err := u.proxyRepo.FindByID(id)
	if err != nil {
		return err
	}

	if existing == nil {
		return apperror.NewNotFoundError("Proxy not found")
	}

	return u.proxyRepo.Delete(id)
}

func (u *proxyUseCaseImpl) ImportFromJSON(list []dto.CreateProxyRequest) (int64, error) {
	if len(list) == 0 {
		return 0, nil
	}

	var proxies []entity.Proxy
	for _, item := range list {
		if item.IP == "" {
			return 0, apperror.NewValidationError("Missing required field 'ip' in import items")
		}

		proxyVal := item.IP
		if item.Proxy != nil && *item.Proxy != "" {
			proxyVal = *item.Proxy
		}

		portVal := "443"
		if item.Port != nil && *item.Port != "" {
			portVal = *item.Port
		}

		proxyIPVal := true
		if item.ProxyIP != nil {
			proxyIPVal = *item.ProxyIP
		}

		latencyVal := 0
		if item.Latency != nil {
			latencyVal = *item.Latency
		}

		asOrg := item.ASOrganization
		if asOrg == nil {
			asOrg = item.ASOrgSnake
		}

		postal := item.PostalCode
		if postal == nil {
			postal = item.PostalCodeSnake
		}

		proxies = append(proxies, entity.Proxy{
			Proxy:          proxyVal,
			Port:           portVal,
			ProxyIP:        proxyIPVal,
			IP:             item.IP,
			Latency:        latencyVal,
			ASN:            item.ASN,
			ASOrganization: asOrg,
			Colo:           item.Colo,
			Country:        item.Country,
			City:           item.City,
			Region:         item.Region,
			PostalCode:     postal,
			Latitude:       item.Latitude,
			Longitude:      item.Longitude,
			IsActive:       true,
		})
	}

	return u.proxyRepo.BulkCreate(proxies)
}

func (u *proxyUseCaseImpl) GetPublicProxyList() ([]dto.PublicProxyItem, error) {
	list, err := u.proxyRepo.GetPublicList()
	if err != nil {
		return nil, err
	}

	var dtoList []dto.PublicProxyItem
	for _, r := range list {
		dtoList = append(dtoList, dto.PublicProxyItem{
			Proxy:          r.Proxy,
			Port:           r.Port,
			ProxyIP:        r.ProxyIP,
			IP:             r.IP,
			Latency:        r.Latency,
			ASN:            r.ASN,
			ASOrganization: r.ASOrganization,
			Colo:           r.Colo,
			Country:        r.Country,
			City:           r.City,
			Region:         r.Region,
			PostalCode:     r.PostalCode,
			Latitude:       r.Latitude,
			Longitude:      r.Longitude,
		})
	}

	return dtoList, nil
}

func (u *proxyUseCaseImpl) GetPublicProxyListGrouped() (map[string][]string, error) {
	list, err := u.proxyRepo.GetPublicList()
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

func (u *proxyUseCaseImpl) LookupGeoIP(ip string) (*geoip.GeoIPResult, error) {
	return u.geoIPService.Lookup(ip)
}

func (u *proxyUseCaseImpl) SyncHealthCheck() {
	go u.RunHealthCheckCycle()
}

func (u *proxyUseCaseImpl) RunHealthCheckCycle() {
	u.mu.Lock()
	if u.isChecking {
		u.mu.Unlock()
		u.log.Info("Health check cycle is already running. Skipping.", "CronCheck")
		return
	}
	u.isChecking = true
	u.mu.Unlock()

	defer func() {
		u.mu.Lock()
		u.isChecking = false
		u.mu.Unlock()
	}()

	batchSize := u.cfg.CronCheck.BatchSize
	if batchSize <= 0 {
		batchSize = 20
	}
	timeoutMs := u.cfg.CronCheck.TimeoutMs
	if timeoutMs <= 0 {
		timeoutMs = 3000
	}

	u.log.Info("Starting proxy health check cycle...", "CronCheck")

	activeProxies, err := u.proxyRepo.FindAllActive()
	if err != nil {
		u.log.Error("Failed to fetch active proxies for health check", err, "CronCheck")
		return
	}

	if len(activeProxies) == 0 {
		u.log.Info("No active proxies found in database. Cycle finished.", "CronCheck")
		return
	}

	u.log.Info(strings.ReplaceAll("Found {count} active proxies to check.", "{count}", strconv.Itoa(len(activeProxies))), "CronCheck")

	var deadIds []uint
	var deadMu sync.Mutex

	// Process in batches
	for i := 0; i < len(activeProxies); i += batchSize {
		end := i + batchSize
		if end > len(activeProxies) {
			end = len(activeProxies)
		}
		batch := activeProxies[i:end]

		var wg sync.WaitGroup
		for _, p := range batch {
			wg.Add(1)
			go func(proxy entity.Proxy) {
				defer wg.Done()

				host := proxy.Proxy
				if host == "" {
					host = proxy.IP
				}

				if ipvalidator.IsPrivateIP(host) {
					u.log.Warn("Cron check blocked private IP range proxy: "+host+":"+proxy.Port+". Marking as dead.", "CronCheck")
					deadMu.Lock()
					deadIds = append(deadIds, proxy.ID)
					deadMu.Unlock()
					return
				}

				var port int
				_, _ = fmtSscanf(proxy.Port, "%d", &port)
				if port <= 0 {
					port = 443
				}

				res := checker.CheckProxy(host, port, timeoutMs)
				if !res.ProxyIP {
					deadMu.Lock()
					deadIds = append(deadIds, proxy.ID)
					deadMu.Unlock()
				}
			}(p)
		}
		wg.Wait()
	}

	if len(deadIds) > 0 {
		u.log.Warn("Found dead proxies. Removing from SQLite database...", "CronCheck")
		deleted, err := u.proxyRepo.BulkDelete(deadIds)
		if err != nil {
			u.log.Error("Error bulk deleting dead proxies", err, "CronCheck")
		} else {
			u.log.Info("Successfully removed dead proxies.", "CronCheck")
			_ = deleted
		}
	} else {
		u.log.Info("All checked proxies are alive!", "CronCheck")
	}

	u.log.Info("Health check cycle complete.", "CronCheck")
}

func fmtSscanf(str string, format string, args ...interface{}) (int, error) {
	// A lightweight custom helper to parse port number without scanning overhead
	var port int
	for _, char := range str {
		if char >= '0' && char <= '9' {
			port = port*10 + int(char-'0')
		} else {
			break
		}
	}
	if len(args) > 0 {
		if ptr, ok := args[0].(*int); ok {
			*ptr = port
			return 1, nil
		}
	}
	return 0, nil
}
