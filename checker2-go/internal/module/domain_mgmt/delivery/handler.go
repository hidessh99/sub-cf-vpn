package delivery

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/domain_mgmt/usecase"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/shared/dto"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/shared/port"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/pkg/apperror"
	"github.com/labstack/echo/v4"
)

type DomainHandler struct {
	domainUseCase usecase.DomainUseCase
	log           port.Logger
}

func NewDomainHandler(domainUseCase usecase.DomainUseCase, log port.Logger) *DomainHandler {
	return &DomainHandler{
		domainUseCase: domainUseCase,
		log:           log,
	}
}

func (h *DomainHandler) GetDomains(c echo.Context) error {
	list, err := h.domainUseCase.GetAllDomains(c.Request().Context())
	if err != nil {
		h.log.Error("GetDomains failed in usecase call", err, "DomainHandler")
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Domains retrieved successfully",
		Data:    list,
	})
}

func (h *DomainHandler) CreateDomain(c echo.Context) error {
	var req CreateDomainRequest
	if err := c.Bind(&req); err != nil {
		h.log.Warn("CreateDomain failed - invalid request binding", "DomainHandler")
		return err
	}
	if err := c.Validate(&req); err != nil {
		h.log.Warn("CreateDomain failed - input validation failed", "DomainHandler")
		return err
	}

	domainEntry, err := h.domainUseCase.CreateDomain(c.Request().Context(), req.Domain)
	if err != nil {
		h.log.Error("CreateDomain failed in usecase call", err, "DomainHandler")
		return err
	}

	return c.JSON(http.StatusCreated, dto.APIResponse{
		Success: true,
		Message: "Domain created successfully",
		Data:    domainEntry,
	})
}

func (h *DomainHandler) DeleteDomain(c echo.Context) error {
	idVal, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		h.log.Warn("DeleteDomain failed - invalid ID parameter", "DomainHandler")
		return apperror.NewValidationError("Invalid ID parameter")
	}

	err = h.domainUseCase.DeleteDomain(c.Request().Context(), uint(idVal))
	if err != nil {
		h.log.Error(fmt.Sprintf("DeleteDomain failed for ID %d in usecase call", idVal), err, "DomainHandler")
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Domain deleted successfully",
		Data:    nil,
	})
}

func (h *DomainHandler) ImportDomains(c echo.Context) error {
	var list []string
	if err := c.Bind(&list); err != nil {
		h.log.Warn("ImportDomains failed - invalid request binding", "DomainHandler")
		return err
	}

	count, err := h.domainUseCase.ImportFromJSON(c.Request().Context(), list)
	if err != nil {
		h.log.Error("ImportDomains failed in usecase call", err, "DomainHandler")
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Successfully imported domains",
		Data:    map[string]interface{}{"imported": count},
	})
}

func (h *DomainHandler) GetPublicDomains(c echo.Context) error {
	list, err := h.domainUseCase.GetPublicDomainList(c.Request().Context())
	if err != nil {
		h.log.Error("GetPublicDomains failed in usecase call", err, "DomainHandler")
		return err
	}
	return c.JSON(http.StatusOK, list)
}
