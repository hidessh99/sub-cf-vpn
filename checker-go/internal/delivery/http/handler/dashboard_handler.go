package handler

import (
	"net/http"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/delivery/http/dto"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/usecase"
	"github.com/labstack/echo/v4"
)

type DashboardHandler struct {
	dashboardUseCase usecase.DashboardUseCase
}

func NewDashboardHandler(dashboardUseCase usecase.DashboardUseCase) *DashboardHandler {
	return &DashboardHandler{dashboardUseCase: dashboardUseCase}
}

func (h *DashboardHandler) GetStats(c echo.Context) error {
	stats, err := h.dashboardUseCase.GetStats()
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Dashboard stats retrieved successfully",
		Data:    stats,
	})
}
