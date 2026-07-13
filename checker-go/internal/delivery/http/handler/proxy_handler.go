package handler

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/delivery/http/dto"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/repository"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/logger"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/apperror"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/checker"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/ipvalidator"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/usecase"
	"github.com/labstack/echo/v4"
)

type ProxyHandler struct {
	proxyUseCase usecase.ProxyUseCase
	log          *logger.LogrusLogger
}

func NewProxyHandler(proxyUseCase usecase.ProxyUseCase, log *logger.LogrusLogger) *ProxyHandler {
	return &ProxyHandler{
		proxyUseCase: proxyUseCase,
		log:          log,
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

	var filters repository.ProxyFilters
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

	data, total, err := h.proxyUseCase.GetAllProxies(page, limit, filters)
	if err != nil {
		h.log.Error("GetProxies failed in usecase call", err, "ProxyHandler")
		return err
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	return c.JSON(http.StatusOK, dto.PaginatedResponse{
		Success: true,
		Data:    data,
		Pagination: dto.PaginationInfo{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}

func (h *ProxyHandler) CreateProxy(c echo.Context) error {
	var req dto.CreateProxyRequest
	if err := c.Bind(&req); err != nil {
		h.log.Warn("CreateProxy failed - invalid request binding", "ProxyHandler")
		return err
	}
	if err := c.Validate(&req); err != nil {
		h.log.Warn("CreateProxy failed - input validation failed", "ProxyHandler")
		return err
	}

	proxy, err := h.proxyUseCase.CreateProxy(req)
	if err != nil {
		h.log.Error("CreateProxy failed in usecase call", err, "ProxyHandler")
		return err
	}

	return c.JSON(http.StatusCreated, dto.APIResponse{
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

	var req dto.UpdateProxyRequest
	if err := c.Bind(&req); err != nil {
		h.log.Warn(fmt.Sprintf("UpdateProxy failed for ID %d - invalid request binding", idVal), "ProxyHandler")
		return err
	}
	if err := c.Validate(&req); err != nil {
		h.log.Warn(fmt.Sprintf("UpdateProxy failed for ID %d - input validation failed", idVal), "ProxyHandler")
		return err
	}

	proxy, err := h.proxyUseCase.UpdateProxy(uint(idVal), req)
	if err != nil {
		h.log.Error(fmt.Sprintf("UpdateProxy failed for ID %d in usecase call", idVal), err, "ProxyHandler")
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Proxy updated successfully",
		Data:    proxy,
	})
}

func (h *ProxyHandler) DeleteProxy(c echo.Context) error {
	idVal, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		h.log.Warn("DeleteProxy failed - invalid ID parameter", "ProxyHandler")
		return apperror.NewValidationError("Invalid ID parameter")
	}

	err = h.proxyUseCase.DeleteProxy(uint(idVal))
	if err != nil {
		h.log.Error(fmt.Sprintf("DeleteProxy failed for ID %d in usecase call", idVal), err, "ProxyHandler")
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Proxy deleted successfully",
		Data:    nil,
	})
}

func (h *ProxyHandler) ImportProxies(c echo.Context) error {
	var req dto.ImportProxyListRequest
	if err := c.Bind(&req); err != nil {
		h.log.Warn("ImportProxies failed - invalid request binding", "ProxyHandler")
		return err
	}
	if err := c.Validate(&req); err != nil {
		h.log.Warn("ImportProxies failed - input validation failed", "ProxyHandler")
		return err
	}

	count, err := h.proxyUseCase.ImportFromJSON(req.Proxies)
	if err != nil {
		h.log.Error("ImportProxies failed in usecase call", err, "ProxyHandler")
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: fmt.Sprintf("Successfully imported %d proxies", count),
		Data:    map[string]interface{}{"imported": count},
	})
}

func (h *ProxyHandler) GetPublicProxies(c echo.Context) error {
	list, err := h.proxyUseCase.GetPublicProxyList()
	if err != nil {
		h.log.Error("GetPublicProxies failed in usecase call", err, "ProxyHandler")
		return err
	}
	return c.JSON(http.StatusOK, list)
}

func (h *ProxyHandler) GetPublicProxiesGrouped(c echo.Context) error {
	list, err := h.proxyUseCase.GetPublicProxyListGrouped()
	if err != nil {
		h.log.Error("GetPublicProxiesGrouped failed in usecase call", err, "ProxyHandler")
		return err
	}
	return c.JSON(http.StatusOK, list)
}

func (h *ProxyHandler) SyncHealth(c echo.Context) error {
	h.proxyUseCase.SyncHealthCheck()
	h.log.Info("Sync health check triggered by admin", "ProxyHandler")
	return c.JSON(http.StatusOK, dto.APIResponse{
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

	data, err := h.proxyUseCase.LookupGeoIP(ip)
	if err != nil {
		h.log.Error("GeoIPLookup failed in usecase call for: "+ip, err, "ProxyHandler")
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
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
		return c.JSON(http.StatusOK, []checker.CheckResult{})
	}

	list := strings.Split(ipsString, ",")
	results := make([]checker.CheckResult, len(list))

	var wg sync.WaitGroup
	for idx, item := range list {
		wg.Add(1)
		go func(i int, val string) {
			defer wg.Done()
			clean := strings.TrimSpace(val)
			if clean == "" {
				results[i] = checker.CheckResult{ProxyIP: false}
				return
			}

			parts := strings.Split(clean, ":")
			ip := parts[0]
			port := 443
			if len(parts) > 1 {
				if val, err := strconv.Atoi(parts[1]); err == nil {
					port = val
				}
			}

			if ipvalidator.IsPrivateIP(ip) {
				h.log.Warn("Direct proxy check blocked private IP: "+ip, "ProxyHandler")
				results[i] = checker.CheckResult{
					IP:      ip,
					Port:    port,
					ProxyIP: false,
					Latency: 0,
				}
				return
			}

			results[i] = checker.CheckProxy(ip, port, 2500)
		}(idx, item)
	}
	wg.Wait()

	c.Response().Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Response().Header().Set("Access-Control-Allow-Origin", "*")
	return c.JSON(http.StatusOK, results)
}
