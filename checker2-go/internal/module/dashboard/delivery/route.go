package delivery

import (
	"github.com/labstack/echo/v4"
)

func RegisterRoutes(adminGroup *echo.Group, handler *DashboardHandler) {
	adminGroup.GET("/dashboard/stats", handler.GetStats)
}
