package test

import (
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/config"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/delivery/http/dto"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/repository"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/apperror"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/geoip"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/usecase"
)

type MockProxyRepository struct {
	db []entity.Proxy
}

func (m *MockProxyRepository) FindAll(page, limit int, filters repository.ProxyFilters) ([]entity.Proxy, int64, error) {
	var list []entity.Proxy
	for _, p := range m.db {
		match := true
		if filters.Country != nil && *filters.Country != "" {
			if p.Country == nil || *p.Country != *filters.Country {
				match = false
			}
		}
		if filters.IsActive != nil {
			if p.IsActive != *filters.IsActive {
				match = false
			}
		}
		if filters.Search != nil && *filters.Search != "" {
			searchVal := strings.ToLower(*filters.Search)
			ipMatch := strings.Contains(strings.ToLower(p.IP), searchVal)
			proxyMatch := strings.Contains(strings.ToLower(p.Proxy), searchVal)
			countryMatch := p.Country != nil && strings.Contains(strings.ToLower(*p.Country), searchVal)
			orgMatch := p.ASOrganization != nil && strings.Contains(strings.ToLower(*p.ASOrganization), searchVal)

			if !ipMatch && !proxyMatch && !countryMatch && !orgMatch {
				match = false
			}
		}

		if match {
			list = append(list, p)
		}
	}

	total := int64(len(list))
	start := (page - 1) * limit
	if start >= len(list) {
		return []entity.Proxy{}, total, nil
	}

	end := start + limit
	if end > len(list) {
		end = len(list)
	}

	return list[start:end], total, nil
}

func (m *MockProxyRepository) FindByID(id uint) (*entity.Proxy, error) {
	for _, p := range m.db {
		if p.ID == id {
			return &p, nil
		}
	}
	return nil, nil
}

func (m *MockProxyRepository) Create(proxy *entity.Proxy) error {
	proxy.ID = uint(len(m.db) + 1)
	proxy.CreatedAt = time.Now()
	proxy.UpdatedAt = time.Now()
	m.db = append(m.db, *proxy)
	return nil
}

func (m *MockProxyRepository) Update(id uint, proxy *entity.Proxy) error {
	for i, p := range m.db {
		if p.ID == id {
			m.db[i] = *proxy
			m.db[i].UpdatedAt = time.Now()
			return nil
		}
	}
	return errors.New("Proxy not found")
}

func (m *MockProxyRepository) Delete(id uint) error {
	var filtered []entity.Proxy
	for _, p := range m.db {
		if p.ID != id {
			filtered = append(filtered, p)
		}
	}
	m.db = filtered
	return nil
}

func (m *MockProxyRepository) BulkCreate(proxies []entity.Proxy) (int64, error) {
	var count int64
	for _, p := range proxies {
		temp := p
		_ = m.Create(&temp)
		count++
	}
	return count, nil
}

func (m *MockProxyRepository) GetPublicList() ([]entity.Proxy, error) {
	var list []entity.Proxy
	for _, p := range m.db {
		if p.IsActive {
			list = append(list, p)
		}
	}
	return list, nil
}

func (m *MockProxyRepository) Count() (int64, error) {
	return int64(len(m.db)), nil
}

func (m *MockProxyRepository) FindAllActive() ([]entity.Proxy, error) {
	var list []entity.Proxy
	for _, p := range m.db {
		if p.IsActive {
			list = append(list, p)
		}
	}
	return list, nil
}

func (m *MockProxyRepository) BulkDelete(ids []uint) (int64, error) {
	var count int64
	var filtered []entity.Proxy
	for _, p := range m.db {
		delete := false
		for _, id := range ids {
			if p.ID == id {
				delete = true
				break
			}
		}
		if delete {
			count++
		} else {
			filtered = append(filtered, p)
		}
	}
	m.db = filtered
	return count, nil
}

func (m *MockProxyRepository) DeleteAll() (int64, error) {
	count := int64(len(m.db))
	m.db = []entity.Proxy{}
	return count, nil
}

type MockGeoIPService struct{}

func (m *MockGeoIPService) Lookup(ip string) (*geoip.GeoIPResult, error) {
	asnVal := 15169
	orgVal := "Google LLC"
	countryVal := "US"
	cityVal := "Mountain View"
	regionVal := "California"
	postalVal := "94043"
	latVal := "37.422"
	lonVal := "-122.084"

	return &geoip.GeoIPResult{
		Success:        true,
		ASN:            &asnVal,
		ASOrganization: &orgVal,
		Country:        &countryVal,
		City:           &cityVal,
		Region:         &regionVal,
		PostalCode:     &postalVal,
		Latitude:       &latVal,
		Longitude:      &lonVal,
	}, nil
}

func TestCreateProxy(t *testing.T) {
	mockRepo := &MockProxyRepository{}
	authUC := usecase.NewProxyUseCase(mockRepo, &MockGeoIPService{}, &config.AppConfig{}, testLogger())

	// Success create
	ipVal := "10.0.0.1"
	proxyVal := "test-proxy"
	portVal := "8080"
	proxyIPVal := true
	latencyVal := 50
	countryVal := "ID"
	orgVal := "Telkom"

	req := dto.CreateProxyRequest{
		IP:             ipVal,
		Proxy:          &proxyVal,
		Port:           &portVal,
		ProxyIP:        &proxyIPVal,
		Latency:        &latencyVal,
		Country:        &countryVal,
		ASOrganization: &orgVal,
	}

	proxy, err := authUC.CreateProxy(req)
	if err != nil {
		t.Fatalf("CreateProxy failed: %v", err)
	}

	if proxy.ID != 1 {
		t.Errorf("Expected ID 1, got %d", proxy.ID)
	}
	if proxy.IP != "10.0.0.1" {
		t.Errorf("Expected IP 10.0.0.1, got %s", proxy.IP)
	}
	if proxy.Proxy != "test-proxy" {
		t.Errorf("Expected proxy name 'test-proxy', got %s", proxy.Proxy)
	}
	if proxy.Port != "8080" {
		t.Errorf("Expected port '8080', got %s", proxy.Port)
	}
	if proxy.Country == nil || *proxy.Country != "ID" {
		t.Errorf("Expected country 'ID', got %v", proxy.Country)
	}
	if proxy.ASOrganization == nil || *proxy.ASOrganization != "Telkom" {
		t.Errorf("Expected AS organization 'Telkom', got %v", proxy.ASOrganization)
	}

	cnt, _ := mockRepo.Count()
	if cnt != 1 {
		t.Errorf("Expected repo count 1, got %d", cnt)
	}

	// Missing IP validation error
	req2 := dto.CreateProxyRequest{
		IP: "",
	}
	_, err = authUC.CreateProxy(req2)
	if err == nil {
		t.Fatal("Expected validation error for empty IP, got nil")
	}
	var appErr *apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode != 400 {
		t.Errorf("Expected validation error (400), got: %v", err)
	}
}

func TestGetAllProxies(t *testing.T) {
	mockRepo := &MockProxyRepository{}
	authUC := usecase.NewProxyUseCase(mockRepo, &MockGeoIPService{}, &config.AppConfig{}, testLogger())

	// Seed
	activeVal := true
	inactiveVal := false
	us := "US"
	id := "ID"
	sg := "SG"

	_, _ = authUC.CreateProxy(dto.CreateProxyRequest{IP: "1.1.1.1", Port: ptrString("443"), Country: &us, IsActive: &activeVal})
	_, _ = authUC.CreateProxy(dto.CreateProxyRequest{IP: "2.2.2.2", Port: ptrString("80"), Country: &id, IsActive: &inactiveVal})
	_, _ = authUC.CreateProxy(dto.CreateProxyRequest{IP: "3.3.3.3", Port: ptrString("443"), Country: &sg, IsActive: &activeVal})

	// Pagination
	page1, total, err := authUC.GetAllProxies(1, 2, repository.ProxyFilters{})
	if err != nil {
		t.Fatalf("GetAllProxies failed: %v", err)
	}
	if total != 3 {
		t.Errorf("Expected total 3, got %d", total)
	}
	if len(page1) != 2 {
		t.Errorf("Expected page 1 size 2, got %d", len(page1))
	}

	page2, _, err := authUC.GetAllProxies(2, 2, repository.ProxyFilters{})
	if err != nil {
		t.Fatalf("GetAllProxies failed: %v", err)
	}
	if len(page2) != 1 {
		t.Errorf("Expected page 2 size 1, got %d", len(page2))
	}

	// Filter by active
	activeFilter := true
	activeList, _, _ := authUC.GetAllProxies(1, 10, repository.ProxyFilters{IsActive: &activeFilter})
	if len(activeList) != 2 {
		t.Errorf("Expected 2 active proxies, got %d", len(activeList))
	}
	for _, p := range activeList {
		if !p.IsActive {
			t.Errorf("Expected only active proxies, got active=%t", p.IsActive)
		}
	}

	// Filter by country
	countryFilter := "ID"
	idList, _, _ := authUC.GetAllProxies(1, 10, repository.ProxyFilters{Country: &countryFilter})
	if len(idList) != 1 || idList[0].IP != "2.2.2.2" {
		t.Errorf("Expected only 2.2.2.2 for country filter 'ID', got %v", idList)
	}

	// Filter by search text
	searchFilter := "3.3.3"
	searchList, _, _ := authUC.GetAllProxies(1, 10, repository.ProxyFilters{Search: &searchFilter})
	if len(searchList) != 1 || searchList[0].Country == nil || *searchList[0].Country != "SG" {
		t.Errorf("Expected 1 result for search query '3.3.3' with country 'SG', got %v", searchList)
	}
}

func TestUpdateProxy(t *testing.T) {
	mockRepo := &MockProxyRepository{}
	authUC := usecase.NewProxyUseCase(mockRepo, &MockGeoIPService{}, &config.AppConfig{}, testLogger())

	created, _ := authUC.CreateProxy(dto.CreateProxyRequest{IP: "1.1.1.1", Port: ptrString("443"), Latency: ptrInt(100)})

	// Update latency & active status
	latencyVal := 50
	activeVal := false
	updated, err := authUC.UpdateProxy(created.ID, dto.UpdateProxyRequest{
		Latency:  &latencyVal,
		IsActive: &activeVal,
	})
	if err != nil {
		t.Fatalf("UpdateProxy failed: %v", err)
	}

	if updated.Latency != 50 {
		t.Errorf("Expected updated latency 50, got %d", updated.Latency)
	}
	if updated.IsActive {
		t.Errorf("Expected updated is_active false, got %t", updated.IsActive)
	}
	if updated.IP != "1.1.1.1" {
		t.Errorf("Expected IP field to remain unchanged ('1.1.1.1'), got %s", updated.IP)
	}

	// Missing proxy update error
	_, err = authUC.UpdateProxy(999, dto.UpdateProxyRequest{Latency: ptrInt(50)})
	if err == nil {
		t.Fatal("Expected NotFoundError for missing proxy, got nil")
	}
	var appErr *apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode != 404 {
		t.Errorf("Expected status 404 NotFoundError, got: %v", err)
	}
}

func TestDeleteProxy(t *testing.T) {
	mockRepo := &MockProxyRepository{}
	authUC := usecase.NewProxyUseCase(mockRepo, &MockGeoIPService{}, &config.AppConfig{}, testLogger())

	created, _ := authUC.CreateProxy(dto.CreateProxyRequest{IP: "1.1.1.1", Port: ptrString("443")})
	cnt, _ := mockRepo.Count()
	if cnt != 1 {
		t.Fatalf("Expected 1 proxy in repository, got %d", cnt)
	}

	err := authUC.DeleteProxy(created.ID)
	if err != nil {
		t.Fatalf("DeleteProxy failed: %v", err)
	}

	cnt, _ = mockRepo.Count()
	if cnt != 0 {
		t.Errorf("Expected 0 proxies in repository, got %d", cnt)
	}

	// Missing proxy delete error
	err = authUC.DeleteProxy(999)
	if err == nil {
		t.Fatal("Expected NotFoundError for missing proxy deletion, got nil")
	}
	var appErr *apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode != 404 {
		t.Errorf("Expected status 404 NotFoundError, got: %v", err)
	}
}

func TestProxyImportFromJSON(t *testing.T) {
	mockRepo := &MockProxyRepository{}
	authUC := usecase.NewProxyUseCase(mockRepo, &MockGeoIPService{}, &config.AppConfig{}, testLogger())

	importCount, err := authUC.ImportFromJSON([]dto.CreateProxyRequest{
		{IP: "8.8.8.8", Port: ptrString("443"), Country: ptrString("US")},
		{IP: "9.9.9.9", Port: ptrString("80"), Country: ptrString("CH")},
	})
	if err != nil {
		t.Fatalf("ImportFromJSON failed: %v", err)
	}

	if importCount != 2 {
		t.Errorf("Expected imported count 2, got %d", importCount)
	}

	cnt, _ := mockRepo.Count()
	if cnt != 2 {
		t.Errorf("Expected repo count 2, got %d", cnt)
	}

	// Import validation failure (missing IP)
	_, err = authUC.ImportFromJSON([]dto.CreateProxyRequest{
		{IP: "8.8.8.8", Port: ptrString("443")},
		{IP: "", Port: ptrString("80")},
	})
	if err == nil {
		t.Fatal("Expected validation error for missing IP in import list, got nil")
	}
	var appErr *apperror.AppError
	if !errors.As(err, &appErr) || appErr.StatusCode != 400 {
		t.Errorf("Expected status 400 validation error, got: %v", err)
	}

	// Test duplicate validation (duplicate in payload, and duplicate against existing database)
	// Currently, DB contains: 8.8.8.8:443 and 9.9.9.9:80.
	// We will import: 8.8.8.8:443 (DB duplicate), 10.10.10.10:443 (New), 10.10.10.10:443 (Payload duplicate)
	importCount2, err := authUC.ImportFromJSON([]dto.CreateProxyRequest{
		{IP: "8.8.8.8", Port: ptrString("443"), Country: ptrString("US")},
		{IP: "10.10.10.10", Port: ptrString("443"), Country: ptrString("ID")},
		{IP: "10.10.10.10", Port: ptrString("443"), Country: ptrString("ID")},
	})
	if err != nil {
		t.Fatalf("ImportFromJSON with duplicates failed: %v", err)
	}

	// Should only import 10.10.10.10:443 (1 proxy)
	if importCount2 != 1 {
		t.Errorf("Expected only 1 proxy imported after deduplication, got %d", importCount2)
	}

	cnt2, _ := mockRepo.Count()
	if cnt2 != 3 {
		t.Errorf("Expected repo total count 3 after deduplication, got %d", cnt2)
	}
}

func TestGetPublicProxyListAndGrouped(t *testing.T) {
	mockRepo := &MockProxyRepository{}
	authUC := usecase.NewProxyUseCase(mockRepo, &MockGeoIPService{}, &config.AppConfig{}, testLogger())

	activeVal := true
	inactiveVal := false
	us := "US"
	id := "ID"

	_, _ = authUC.CreateProxy(dto.CreateProxyRequest{IP: "1.1.1.1", Proxy: ptrString("proxy1"), Port: ptrString("443"), Country: &us, IsActive: &activeVal})
	_, _ = authUC.CreateProxy(dto.CreateProxyRequest{IP: "2.2.2.2", Proxy: ptrString("proxy2"), Port: ptrString("80"), Country: &id, IsActive: &inactiveVal})
	_, _ = authUC.CreateProxy(dto.CreateProxyRequest{IP: "3.3.3.3", Proxy: ptrString("proxy3"), Port: ptrString("443"), Country: &us, IsActive: &activeVal})

	// Test GetPublicProxyList
	publicList, err := authUC.GetPublicProxyList()
	if err != nil {
		t.Fatalf("GetPublicProxyList failed: %v", err)
	}
	if len(publicList) != 2 {
		t.Errorf("Expected 2 active proxies, got %d", len(publicList))
	}
	ips := map[string]bool{}
	for _, p := range publicList {
		ips[p.IP] = true
	}
	if !ips["1.1.1.1"] || !ips["3.3.3.3"] || ips["2.2.2.2"] {
		t.Errorf("Expected active IPs 1.1.1.1 and 3.3.3.3, got: %v", ips)
	}

	// Test GetPublicProxyListGrouped
	grouped, err := authUC.GetPublicProxyListGrouped()
	if err != nil {
		t.Fatalf("GetPublicProxyListGrouped failed: %v", err)
	}
	if len(grouped["US"]) != 2 {
		t.Errorf("Expected 2 proxies for grouped 'US', got %d", len(grouped["US"]))
	}
	usProxies := map[string]bool{}
	for _, p := range grouped["US"] {
		usProxies[p] = true
	}
	if !usProxies["proxy1:443"] || !usProxies["proxy3:443"] {
		t.Errorf("Expected US proxies proxy1:443 and proxy3:443, got %v", grouped["US"])
	}
	if _, exists := grouped["ID"]; exists {
		t.Error("Expected inactive country 'ID' group to be empty/non-existent")
	}
}

func TestDeleteAllProxies(t *testing.T) {
	repo := &MockProxyRepository{
		db: []entity.Proxy{
			{ID: 1, IP: "1.1.1.1", Proxy: "proxy1", Port: "443", IsActive: true},
			{ID: 2, IP: "2.2.2.2", Proxy: "proxy2", Port: "443", IsActive: false},
		},
	}
	geo := &MockGeoIPService{}
	cfg := &config.AppConfig{}
	logger := testLogger()
	uc := usecase.NewProxyUseCase(repo, geo, cfg, logger)

	count, err := uc.DeleteAllProxies()
	if err != nil {
		t.Fatalf("DeleteAllProxies failed: %v", err)
	}
	if count != 2 {
		t.Errorf("Expected 2 proxies deleted, got %d", count)
	}

	total, err := repo.Count()
	if err != nil {
		t.Fatalf("repo.Count failed: %v", err)
	}
	if total != 0 {
		t.Errorf("Expected repo to be empty, got %d", total)
	}
}

