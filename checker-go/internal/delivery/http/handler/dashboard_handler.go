package handler

import (
	"net/http"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/delivery/http/dto"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/logger"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/usecase"
	"github.com/labstack/echo/v4"
)

type DashboardHandler struct {
	dashboardUseCase usecase.DashboardUseCase
	log              *logger.LogrusLogger
}

func NewDashboardHandler(dashboardUseCase usecase.DashboardUseCase, log *logger.LogrusLogger) *DashboardHandler {
	return &DashboardHandler{
		dashboardUseCase: dashboardUseCase,
		log:              log,
	}
}

func (h *DashboardHandler) GetStats(c echo.Context) error {
	stats, err := h.dashboardUseCase.GetStats()
	if err != nil {
		h.log.Error("GetStats failed in usecase call", err, "DashboardHandler")
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Dashboard stats retrieved successfully",
		Data:    stats,
	})
}
