package delivery

import (
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"

	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/module/proxy/domain"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/module/proxy/usecase"
	sharedDto "github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/shared/dto"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/shared/port"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/pkg/apperror"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/pkg/ipvalidator"
	"github.com/labstack/echo/v4"
)

type ProxyHandler struct {
	proxyUseCase  usecase.ProxyUseCase
	proxyChecker  domain.ProxyChecker
	log           port.Logger
}

func NewProxyHandler(proxyUseCase usecase.ProxyUseCase, proxyChecker domain.ProxyChecker, log port.Logger) *ProxyHandler {
	return &ProxyHandler{
		proxyUseCase:  proxyUseCase,
		proxyChecker:  proxyChecker,
		log:           log,
	}
}

func (h *ProxyHandler) GetProxies(c echo.Context) error {
	page, err := strconv.Atoi(c.QueryParam("page"))
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(c.QueryParam("limit"))
	if err != nil || limit < 1 {
		limit = 10
	}

	search := c.QueryParam("search")
	country := c.QueryParam("country")
	isActiveStr := c.QueryParam("is_active")

	var filters domain.ProxyFilters
	if search != "" {
		filters.Search = &search
	}
	if country != "" {
		filters.Country = &country
	}
	if isActiveStr != "" {
		isActiveVal := isActiveStr == "true"
		filters.IsActive = &isActiveVal
	}

	data, total, err := h.proxyUseCase.GetAllProxies(c.Request().Context(), page, limit, filters)
	if err != nil {
		h.log.Error("GetProxies failed in usecase call", err, "ProxyHandler")
		return err
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	return c.JSON(http.StatusOK, sharedDto.PaginatedResponse{
		Success: true,
		Data:    data,
		Pagination: sharedDto.PaginationInfo{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}

func (h *ProxyHandler) CreateProxy(c echo.Context) error {
	var req CreateProxyRequest
	if err := c.Bind(&req); err != nil {
		h.log.Warn("CreateProxy failed - invalid request binding", "ProxyHandler")
		return err
	}
	if err := c.Validate(&req); err != nil {
		h.log.Warn("CreateProxy failed - input validation failed", "ProxyHandler")
		return err
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

	asOrg := req.ASOrganization
	if asOrg == nil {
		asOrg = req.ASOrgSnake
	}

	postal := req.PostalCode
	if postal == nil {
		postal = req.PostalCodeSnake
	}

	proxy := &domain.Proxy{
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

	err := h.proxyUseCase.CreateProxy(c.Request().Context(), proxy)
	if err != nil {
		h.log.Error("CreateProxy failed in usecase call", err, "ProxyHandler")
		return err
	}

	return c.JSON(http.StatusCreated, sharedDto.APIResponse{
		Success: true,
		Message: "Proxy created successfully",
		Data:    proxy,
	})
}

func (h *ProxyHandler) UpdateProxy(c echo.Context) error {
	idVal, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		h.log.Warn("UpdateProxy failed - invalid ID parameter", "ProxyHandler")
		return apperror.NewValidationError("Invalid ID parameter")
	}

	var req UpdateProxyRequest
	if err := c.Bind(&req); err != nil {
		h.log.Warn(fmt.Sprintf("UpdateProxy failed for ID %d - invalid request binding", idVal), "ProxyHandler")
		return err
	}
	if err := c.Validate(&req); err != nil {
		h.log.Warn(fmt.Sprintf("UpdateProxy failed for ID %d - input validation failed", idVal), "ProxyHandler")
		return err
	}

	proxy := &domain.Proxy{}
	if req.Proxy != nil {
		proxy.Proxy = *req.Proxy
	}
	if req.Port != nil {
		proxy.Port = *req.Port
	}
	if req.ProxyIP != nil {
		proxy.ProxyIP = *req.ProxyIP
	}
	if req.IP != nil {
		proxy.IP = *req.IP
	}
	if req.Latency != nil {
		proxy.Latency = *req.Latency
	}
	if req.ASN != nil {
		proxy.ASN = req.ASN
	}
	if req.ASOrganization != nil {
		proxy.ASOrganization = req.ASOrganization
	} else if req.ASOrgSnake != nil {
		proxy.ASOrganization = req.ASOrgSnake
	}
	if req.Colo != nil {
		proxy.Colo = req.Colo
	}
	if req.Country != nil {
		proxy.Country = req.Country
	}
	if req.City != nil {
		proxy.City = req.City
	}
	if req.Region != nil {
		proxy.Region = req.Region
	}
	if req.PostalCode != nil {
		proxy.PostalCode = req.PostalCode
	} else if req.PostalCodeSnake != nil {
		proxy.PostalCode = req.PostalCodeSnake
	}
	if req.Latitude != nil {
		proxy.Latitude = req.Latitude
	}
	if req.Longitude != nil {
		proxy.Longitude = req.Longitude
	}
	if req.IsActive != nil {
		proxy.IsActive = *req.IsActive
	}

	updated, err := h.proxyUseCase.UpdateProxy(c.Request().Context(), uint(idVal), proxy)
	if err != nil {
		h.log.Error(fmt.Sprintf("UpdateProxy failed for ID %d in usecase call", idVal), err, "ProxyHandler")
		return err
	}

	return c.JSON(http.StatusOK, sharedDto.APIResponse{
		Success: true,
		Message: "Proxy updated successfully",
		Data:    updated,
	})
}

func (h *ProxyHandler) DeleteProxy(c echo.Context) error {
	idVal, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		h.log.Warn("DeleteProxy failed - invalid ID parameter", "ProxyHandler")
		return apperror.NewValidationError("Invalid ID parameter")
	}

	err = h.proxyUseCase.DeleteProxy(c.Request().Context(), uint(idVal))
	if err != nil {
		h.log.Error(fmt.Sprintf("DeleteProxy failed for ID %d in usecase call", idVal), err, "ProxyHandler")
		return err
	}

	return c.JSON(http.StatusOK, sharedDto.APIResponse{
		Success: true,
		Message: "Proxy deleted successfully",
		Data:    nil,
	})
}

func (h *ProxyHandler) DeleteAllProxies(c echo.Context) error {
	count, err := h.proxyUseCase.DeleteAllProxies(c.Request().Context())
	if err != nil {
		h.log.Error("DeleteAllProxies failed in usecase call", err, "ProxyHandler")
		return err
	}

	return c.JSON(http.StatusOK, sharedDto.APIResponse{
		Success: true,
		Message: fmt.Sprintf("Successfully deleted all %d proxies", count),
		Data:    map[string]interface{}{"deleted": count},
	})
}

func (h *ProxyHandler) ImportProxies(c echo.Context) error {
	var req ImportProxyListRequest
	if err := c.Bind(&req); err != nil {
		h.log.Warn("ImportProxies failed - invalid request binding", "ProxyHandler")
		return err
	}
	if err := c.Validate(&req); err != nil {
		h.log.Warn("ImportProxies failed - input validation failed", "ProxyHandler")
		return err
	}

	var proxies []domain.Proxy
	for _, item := range req.Proxies {
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

		proxies = append(proxies, domain.Proxy{
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

	count, err := h.proxyUseCase.ImportFromJSON(c.Request().Context(), proxies)
	if err != nil {
		h.log.Error("ImportProxies failed in usecase call", err, "ProxyHandler")
		return err
	}

	return c.JSON(http.StatusOK, sharedDto.APIResponse{
		Success: true,
		Message: fmt.Sprintf("Successfully imported %d proxies", count),
		Data:    map[string]interface{}{"imported": count},
	})
}

func (h *ProxyHandler) GetPublicProxies(c echo.Context) error {
	list, err := h.proxyUseCase.GetPublicProxyList(c.Request().Context())
	if err != nil {
		h.log.Error("GetPublicProxies failed in usecase call", err, "ProxyHandler")
		return err
	}

	var dtoList []PublicProxyItem
	for _, r := range list {
		dtoList = append(dtoList, PublicProxyItem{
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

	return c.JSON(http.StatusOK, dtoList)
}

func (h *ProxyHandler) GetPublicProxiesGrouped(c echo.Context) error {
	list, err := h.proxyUseCase.GetPublicProxyListGrouped(c.Request().Context())
	if err != nil {
		h.log.Error("GetPublicProxiesGrouped failed in usecase call", err, "ProxyHandler")
		return err
	}
	return c.JSON(http.StatusOK, list)
}

func (h *ProxyHandler) SyncHealth(c echo.Context) error {
	h.proxyUseCase.SyncHealthCheck(c.Request().Context())
	h.log.Info("Sync health check triggered by admin", "ProxyHandler")
	return c.JSON(http.StatusOK, sharedDto.APIResponse{
		Success: true,
		Message: "Proxy health check started in the background",
		Data:    nil,
	})
}

func (h *ProxyHandler) GeoIPLookup(c echo.Context) error {
	ip := c.QueryParam("ip")
	if ip == "" {
		h.log.Warn("GeoIPLookup failed - IP address parameter missing", "ProxyHandler")
		return apperror.NewValidationError("IP address parameter is required")
	}

	if ipvalidator.IsPrivateIP(ip) {
		h.log.Warn("GeoIPLookup blocked - private IP lookup attempt: "+ip, "ProxyHandler")
		return apperror.NewValidationError("Invalid public IP address")
	}

	data, err := h.proxyUseCase.LookupGeoIP(c.Request().Context(), ip)
	if err != nil {
		h.log.Error("GeoIPLookup failed in usecase call for: "+ip, err, "ProxyHandler")
		return err
	}

	return c.JSON(http.StatusOK, sharedDto.APIResponse{
		Success: true,
		Message: "GeoIP lookup successful",
		Data:    data,
	})
}

func (h *ProxyHandler) CheckProxies(c echo.Context) error {
	ipsString := c.QueryParam("ips")
	if ipsString == "" {
		ipsString = c.QueryParam("ip")
	}
	if ipsString == "" {
		paramIps := c.Param("ips")
		if paramIps != "" {
			decoded, err := url.QueryUnescape(paramIps)
			if err == nil {
				ipsString = decoded
			}
		}
	}

	if ipsString == "" {
		return c.JSON(http.StatusOK, []domain.CheckResult{})
	}

	list := strings.Split(ipsString, ",")
	results := make([]domain.CheckResult, len(list))

	var wg sync.WaitGroup
	for idx, item := range list {
		wg.Add(1)
		go func(i int, val string) {
			defer wg.Done()
			clean := strings.TrimSpace(val)
			if clean == "" {
				results[i] = domain.CheckResult{ProxyIP: false}
				return
			}

			ip := clean
			port := 443
			if h, p, err := net.SplitHostPort(clean); err == nil {
				ip = h
				if val, err := strconv.Atoi(p); err == nil {
					port = val
				}
			}

			if ipvalidator.IsPrivateIP(ip) {
				h.log.Warn("Direct proxy check blocked private IP: "+ip, "ProxyHandler")
				results[i] = domain.CheckResult{
					IP:      ip,
					Port:    port,
					ProxyIP: false,
					Latency: 0,
				}
				return
			}

			res := h.proxyChecker.Check(ip, port, 2500)
			results[i] = res
		}(idx, item)
	}
	wg.Wait()

	c.Response().Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Response().Header().Set("Access-Control-Allow-Origin", "*")
	return c.JSON(http.StatusOK, results)
}
