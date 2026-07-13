package handler

import (
	"net/http"
	"strconv"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/delivery/http/dto"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/apperror"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/usecase"
	"github.com/labstack/echo/v4"
)

type DomainHandler struct {
	domainUseCase usecase.DomainUseCase
}

func NewDomainHandler(domainUseCase usecase.DomainUseCase) *DomainHandler {
	return &DomainHandler{domainUseCase: domainUseCase}
}

func (h *DomainHandler) GetDomains(c echo.Context) error {
	list, err := h.domainUseCase.GetAllDomains()
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Domains retrieved successfully",
		Data:    list,
	})
}

func (h *DomainHandler) CreateDomain(c echo.Context) error {
	var req dto.CreateDomainRequest
	if err := c.Bind(&req); err != nil {
		return err
	}
	if err := c.Validate(&req); err != nil {
		return err
	}

	domain, err := h.domainUseCase.CreateDomain(req.Domain)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, dto.APIResponse{
		Success: true,
		Message: "Domain created successfully",
		Data:    domain,
	})
}

func (h *DomainHandler) DeleteDomain(c echo.Context) error {
	idVal, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return apperror.NewValidationError("Invalid ID parameter")
	}

	err = h.domainUseCase.DeleteDomain(uint(idVal))
	if err != nil {
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
		return err
	}

	count, err := h.domainUseCase.ImportFromJSON(list)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Successfully imported domains",
		Data:    map[string]interface{}{"imported": count},
	})
}

func (h *DomainHandler) GetPublicDomains(c echo.Context) error {
	list, err := h.domainUseCase.GetPublicDomainList()
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, list)
}
