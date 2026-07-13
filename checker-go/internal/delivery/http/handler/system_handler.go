package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type SystemHandler struct {
	db *gorm.DB
}

func NewSystemHandler(db *gorm.DB) *SystemHandler {
	return &SystemHandler{db: db}
}

type healthCheckResponse struct {
	Status  string            `json:"status"`
	Service string            `json:"service"`
	Runtime string            `json:"runtime"`
	Details map[string]string `json:"details"`
}

func (h *SystemHandler) HealthCheck(c echo.Context) error {
	dbStatus := "ok"

	// Ping database using raw query
	sqlDB, err := h.db.DB()
	if err == nil {
		if err = sqlDB.Ping(); err != nil {
			dbStatus = "error"
		}
	} else {
		dbStatus = "error"
	}

	overallStatus := "ok"
	statusCode := http.StatusOK
	if dbStatus != "ok" {
		overallStatus = "degraded"
		statusCode = http.StatusServiceUnavailable
	}

	return c.JSON(statusCode, healthCheckResponse{
		Status:  overallStatus,
		Service: "lufeng-vpn-checker",
		Runtime: "go",
		Details: map[string]string{
			"database": dbStatus,
		},
	})
}
