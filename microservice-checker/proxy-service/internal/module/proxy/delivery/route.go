package delivery

import (
	"github.com/labstack/echo/v4"
)

func RegisterRoutes(adminGroup *echo.Group, publicGroup *echo.Group, checkerGroup *echo.Group, handler *ProxyHandler) {
	// Proxies Admin
	adminGroup.GET("/proxies", handler.GetProxies)
	adminGroup.POST("/proxies", handler.CreateProxy)
	adminGroup.PUT("/proxies/:id", handler.UpdateProxy)
	adminGroup.DELETE("/proxies", handler.DeleteAllProxies)
	adminGroup.DELETE("/proxies/:id", handler.DeleteProxy)
	adminGroup.POST("/proxies/import", handler.ImportProxies)
	adminGroup.POST("/proxies/sync-health", handler.SyncHealth)
	adminGroup.GET("/proxies/geoip", handler.GeoIPLookup)

	// Public API
	publicGroup.GET("/proxies", handler.GetPublicProxies)
	publicGroup.GET("/proxies/grouped", handler.GetPublicProxiesGrouped)

	// Checker Group
	checkerGroup.GET("/check/:ips", handler.CheckProxies)
	checkerGroup.GET("/check", handler.CheckProxies)
}
