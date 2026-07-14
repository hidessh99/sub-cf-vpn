package delivery

import (
	"github.com/labstack/echo/v4"
)

func RegisterRoutes(adminGroup *echo.Group, publicGroup *echo.Group, handler *DomainHandler) {
	// Domains Admin
	adminGroup.GET("/domains", handler.GetDomains)
	adminGroup.POST("/domains", handler.CreateDomain)
	adminGroup.DELETE("/domains/:id", handler.DeleteDomain)
	adminGroup.POST("/domains/import", handler.ImportDomains)

	// Public API Group
	publicGroup.GET("/domains", handler.GetPublicDomains)
}
