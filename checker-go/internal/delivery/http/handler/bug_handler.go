package handler

import (
	"net/http"
	"strconv"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/delivery/http/dto"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/apperror"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/usecase"
	"github.com/labstack/echo/v4"
)

type BugHandler struct {
	bugUseCase usecase.BugUseCase
}

func NewBugHandler(bugUseCase usecase.BugUseCase) *BugHandler {
	return &BugHandler{bugUseCase: bugUseCase}
}

func (h *BugHandler) GetBugs(c echo.Context) error {
	list, err := h.bugUseCase.GetAllBugs()
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Bugs retrieved successfully",
		Data:    list,
	})
}

func (h *BugHandler) CreateBug(c echo.Context) error {
	var req dto.CreateBugRequest
	if err := c.Bind(&req); err != nil {
		return err
	}
	if err := c.Validate(&req); err != nil {
		return err
	}

	bug, err := h.bugUseCase.CreateBug(req.Hostname)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, dto.APIResponse{
		Success: true,
		Message: "Bug created successfully",
		Data:    bug,
	})
}

func (h *BugHandler) DeleteBug(c echo.Context) error {
	idVal, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return apperror.NewValidationError("Invalid ID parameter")
	}

	err = h.bugUseCase.DeleteBug(uint(idVal))
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Bug deleted successfully",
		Data:    nil,
	})
}

func (h *BugHandler) ImportBugs(c echo.Context) error {
	var list []string
	if err := c.Bind(&list); err != nil {
		return err
	}

	count, err := h.bugUseCase.ImportFromJSON(list)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Successfully imported bugs",
		Data:    map[string]interface{}{"imported": count},
	})
}

func (h *BugHandler) GetPublicBugs(c echo.Context) error {
	list, err := h.bugUseCase.GetPublicBugList()
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, list)
}
