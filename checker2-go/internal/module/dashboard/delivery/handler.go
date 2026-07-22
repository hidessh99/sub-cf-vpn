package delivery

import (
	"net/http"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/dashboard/usecase"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/shared/dto"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/shared/port"
	"github.com/labstack/echo/v4"
)

type DashboardHandler struct {
	dashboardUseCase usecase.DashboardUseCase
	log              port.Logger
}

func NewDashboardHandler(dashboardUseCase usecase.DashboardUseCase, log port.Logger) *DashboardHandler {
	return &DashboardHandler{
		dashboardUseCase: dashboardUseCase,
		log:              log,
	}
}

func (h *DashboardHandler) GetStats(c echo.Context) error {
	stats, err := h.dashboardUseCase.GetStats(c.Request().Context())
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
