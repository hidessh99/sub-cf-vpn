package delivery

import (
	"github.com/labstack/echo/v4"
)

func RegisterRoutes(adminGroup *echo.Group, publicGroup *echo.Group, handler *BugHandler) {
	// Bugs Admin
	adminGroup.GET("/bugs", handler.GetBugs)
	adminGroup.POST("/bugs", handler.CreateBug)
	adminGroup.DELETE("/bugs/:id", handler.DeleteBug)
	adminGroup.POST("/bugs/import", handler.ImportBugs)

	// Public API Group
	publicGroup.GET("/bugs", handler.GetPublicBugs)
}
