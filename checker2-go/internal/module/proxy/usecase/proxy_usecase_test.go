package usecase

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/infrastructure/config"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/proxy/domain"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/pkg/apperror"
)

type MockProxyRepository struct {
	db []domain.Proxy
}

func (m *MockProxyRepository) FindAll(ctx context.Context, page, limit int, filters domain.ProxyFilters) ([]domain.Proxy, int64, error) {
	var list []domain.Proxy
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
		return []domain.Proxy{}, total, nil
	}

	end := start + limit
	if end > len(list) {
		end = len(list)
	}

	return list[start:end], total, nil
}

func (m *MockProxyRepository) FindByID(ctx context.Context, id uint) (*domain.Proxy, error) {
	for _, p := range m.db {
		if p.ID == id {
			return &p, nil
		}
	}
	return nil, nil
}

func (m *MockProxyRepository) Create(ctx context.Context, proxy *domain.Proxy) error {
	proxy.ID = uint(len(m.db) + 1)
	proxy.CreatedAt = time.Now()
	proxy.UpdatedAt = time.Now()
	m.db = append(m.db, *proxy)
	return nil
}

func (m *MockProxyRepository) Update(ctx context.Context, id uint, proxy *domain.Proxy) error {
	for i, p := range m.db {
		if p.ID == id {
			m.db[i] = *proxy
			m.db[i].UpdatedAt = time.Now()
			return nil
		}
	}
	return errors.New("Proxy not found")
}

func (m *MockProxyRepository) Delete(ctx context.Context, id uint) error {
	var filtered []domain.Proxy
	for _, p := range m.db {
		if p.ID != id {
			filtered = append(filtered, p)
		}
	}
	m.db = filtered
	return nil
}

func (m *MockProxyRepository) BulkCreate(ctx context.Context, proxies []domain.Proxy) (int64, error) {
	var count int64
	for _, p := range proxies {
		temp := p
		_ = m.Create(ctx, &temp)
		count++
	}
	return count, nil
}

func (m *MockProxyRepository) GetPublicList(ctx context.Context) ([]domain.Proxy, error) {
	var list []domain.Proxy
	for _, p := range m.db {
		if p.IsActive {
			list = append(list, p)
		}
	}
	return list, nil
}

func (m *MockProxyRepository) Count(ctx context.Context) (int64, error) {
	return int64(len(m.db)), nil
}

func (m *MockProxyRepository) FindAllActive(ctx context.Context) ([]domain.Proxy, error) {
	var list []domain.Proxy
	for _, p := range m.db {
		if p.IsActive {
			list = append(list, p)
		}
	}
	return list, nil
}

func (m *MockProxyRepository) BulkDelete(ctx context.Context, ids []uint) (int64, error) {
	var count int64
	var filtered []domain.Proxy
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

func (m *MockProxyRepository) DeleteAll(ctx context.Context) (int64, error) {
	count := int64(len(m.db))
	m.db = []domain.Proxy{}
	return count, nil
}

type MockGeoIPService struct{}

func (m *MockGeoIPService) Lookup(ip string) (*domain.GeoIPResult, error) {
	asnVal := 15169
	orgVal := "Google LLC"
	countryVal := "US"
	cityVal := "Mountain View"
	regionVal := "California"
	postalVal := "94043"
	latVal := "37.422"
	lonVal := "-122.084"

	return &domain.GeoIPResult{
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

type MockProxyChecker struct{}

func (m *MockProxyChecker) Check(host string, port int, timeoutMs int) domain.CheckResult {
	return domain.CheckResult{
		IP:      host,
		Port:    port,
		ProxyIP: true,
		Latency: 50,
	}
}

type dummyLogger struct{}

func (d dummyLogger) Debug(msg string, ctx string)             {}
func (d dummyLogger) Info(msg string, ctx string)              {}
func (d dummyLogger) Warn(msg string, ctx string)              {}
func (d dummyLogger) Error(msg string, err error, ctx string) {}

func ptrString(s string) *string {
	return &s
}

func ptrInt(i int) *int {
	return &i
}

func ptrBool(b bool) *bool {
	return &b
}

func TestCreateProxy(t *testing.T) {
	mockRepo := &MockProxyRepository{}
	proxyUC := NewProxyUseCase(mockRepo, &MockProxyChecker{}, &MockGeoIPService{}, &config.AppConfig{}, dummyLogger{})

	ipVal := "1.1.1.1"
	proxyVal := "test-proxy"
	portVal := "8080"
	countryVal := "ID"
	orgVal := "Telkom"

	p := &domain.Proxy{
		IP:             ipVal,
		Proxy:          proxyVal,
		Port:           portVal,
		Country:        &countryVal,
		ASOrganization: &orgVal,
		IsActive:       true,
	}

	err := proxyUC.CreateProxy(context.Background(), p)
	if err != nil {
		t.Fatalf("CreateProxy failed: %v", err)
	}

	if p.ID != 1 {
		t.Errorf("Expected ID 1, got %d", p.ID)
	}

	cnt, _ := mockRepo.Count(context.Background())
	if cnt != 1 {
		t.Errorf("Expected repo count 1, got %d", cnt)
	}

	// Missing IP validation error
	p2 := &domain.Proxy{
		IP: "",
	}
	err = proxyUC.CreateProxy(context.Background(), p2)
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
	proxyUC := NewProxyUseCase(mockRepo, &MockProxyChecker{}, &MockGeoIPService{}, &config.AppConfig{}, dummyLogger{})

	us := "US"
	id := "ID"
	sg := "SG"

	_ = proxyUC.CreateProxy(context.Background(), &domain.Proxy{IP: "1.1.1.1", Port: "443", Country: &us, IsActive: true})
	_ = proxyUC.CreateProxy(context.Background(), &domain.Proxy{IP: "2.2.2.2", Port: "80", Country: &id, IsActive: false})
	_ = proxyUC.CreateProxy(context.Background(), &domain.Proxy{IP: "3.3.3.3", Port: "443", Country: &sg, IsActive: true})

	// Pagination
	page1, total, err := proxyUC.GetAllProxies(context.Background(), 1, 2, domain.ProxyFilters{})
	if err != nil {
		t.Fatalf("GetAllProxies failed: %v", err)
	}
	if total != 3 {
		t.Errorf("Expected total 3, got %d", total)
	}
	if len(page1) != 2 {
		t.Errorf("Expected page 1 size 2, got %d", len(page1))
	}

	// Filter by active
	activeFilter := true
	activeList, _, _ := proxyUC.GetAllProxies(context.Background(), 1, 10, domain.ProxyFilters{IsActive: &activeFilter})
	if len(activeList) != 2 {
		t.Errorf("Expected 2 active proxies, got %d", len(activeList))
	}

	// Filter by country
	countryFilter := "ID"
	idList, _, _ := proxyUC.GetAllProxies(context.Background(), 1, 10, domain.ProxyFilters{Country: &countryFilter})
	if len(idList) != 1 || idList[0].IP != "2.2.2.2" {
		t.Errorf("Expected only 2.2.2.2 for country filter 'ID', got %v", idList)
	}
}

func TestUpdateProxy(t *testing.T) {
	mockRepo := &MockProxyRepository{}
	proxyUC := NewProxyUseCase(mockRepo, &MockProxyChecker{}, &MockGeoIPService{}, &config.AppConfig{}, dummyLogger{})

	created := &domain.Proxy{IP: "1.1.1.1", Port: "443", Latency: 100, IsActive: true}
	_ = proxyUC.CreateProxy(context.Background(), created)

	// Update latency & active status
	updated, err := proxyUC.UpdateProxy(context.Background(), created.ID, &domain.Proxy{
		Latency:  50,
		IsActive: false,
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

	// Missing proxy update error
	_, err = proxyUC.UpdateProxy(context.Background(), 999, &domain.Proxy{Latency: 50})
	if err == nil {
		t.Fatal("Expected NotFoundError for missing proxy, got nil")
	}
}

func TestDeleteProxy(t *testing.T) {
	mockRepo := &MockProxyRepository{}
	proxyUC := NewProxyUseCase(mockRepo, &MockProxyChecker{}, &MockGeoIPService{}, &config.AppConfig{}, dummyLogger{})

	created := &domain.Proxy{IP: "1.1.1.1", Port: "443"}
	_ = proxyUC.CreateProxy(context.Background(), created)

	cnt, _ := mockRepo.Count(context.Background())
	if cnt != 1 {
		t.Fatalf("Expected 1 proxy in repository, got %d", cnt)
	}

	err := proxyUC.DeleteProxy(context.Background(), created.ID)
	if err != nil {
		t.Fatalf("DeleteProxy failed: %v", err)
	}

	cnt, _ = mockRepo.Count(context.Background())
	if cnt != 0 {
		t.Errorf("Expected 0 proxies in repository, got %d", cnt)
	}
}
