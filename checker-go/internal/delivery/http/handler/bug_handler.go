package handler

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/delivery/http/dto"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/logger"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/apperror"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/usecase"
	"github.com/labstack/echo/v4"
)

type BugHandler struct {
	bugUseCase usecase.BugUseCase
	log        *logger.LogrusLogger
}

func NewBugHandler(bugUseCase usecase.BugUseCase, log *logger.LogrusLogger) *BugHandler {
	return &BugHandler{
		bugUseCase: bugUseCase,
		log:        log,
	}
}

func (h *BugHandler) GetBugs(c echo.Context) error {
	list, err := h.bugUseCase.GetAllBugs()
	if err != nil {
		h.log.Error("GetBugs failed in usecase call", err, "BugHandler")
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
		h.log.Warn("CreateBug failed - invalid request binding", "BugHandler")
		return err
	}
	if err := c.Validate(&req); err != nil {
		h.log.Warn("CreateBug failed - input validation failed", "BugHandler")
		return err
	}

	bug, err := h.bugUseCase.CreateBug(req.Hostname)
	if err != nil {
		h.log.Error("CreateBug failed in usecase call", err, "BugHandler")
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
		h.log.Warn("DeleteBug failed - invalid ID parameter", "BugHandler")
		return apperror.NewValidationError("Invalid ID parameter")
	}

	err = h.bugUseCase.DeleteBug(uint(idVal))
	if err != nil {
		h.log.Error(fmt.Sprintf("DeleteBug failed for ID %d in usecase call", idVal), err, "BugHandler")
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
		h.log.Warn("ImportBugs failed - invalid request binding", "BugHandler")
		return err
	}

	count, err := h.bugUseCase.ImportFromJSON(list)
	if err != nil {
		h.log.Error("ImportBugs failed in usecase call", err, "BugHandler")
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
		h.log.Error("GetPublicBugs failed in usecase call", err, "BugHandler")
		return err
	}
	return c.JSON(http.StatusOK, list)
}
