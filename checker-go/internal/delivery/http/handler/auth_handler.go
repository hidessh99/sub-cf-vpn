package handler

import (
	"net/http"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/delivery/http/dto"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/delivery/http/middleware"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/logger"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/apperror"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/usecase"
	"github.com/labstack/echo/v4"
)

type AuthHandler struct {
	authUseCase usecase.AuthUseCase
	log         *logger.LogrusLogger
}

func NewAuthHandler(authUseCase usecase.AuthUseCase, log *logger.LogrusLogger) *AuthHandler {
	return &AuthHandler{
		authUseCase: authUseCase,
		log:         log,
	}
}

func (h *AuthHandler) Login(c echo.Context) error {
	var req dto.LoginRequest
	if err := c.Bind(&req); err != nil {
		h.log.Warn("Login failed - invalid request binding", "AuthHandler")
		return err
	}
	if err := c.Validate(&req); err != nil {
		h.log.Warn("Login failed - input validation failed", "AuthHandler")
		return err
	}

	token, admin, err := h.authUseCase.Login(req.Username, req.Password)
	if err != nil {
		h.log.Warn("Login failed - auth usecase returned error: "+err.Error(), "AuthHandler")
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Login successful",
		Data: map[string]interface{}{
			"token": token,
			"admin": admin,
		},
	})
}

func (h *AuthHandler) GetProfile(c echo.Context) error {
	adminCtx := c.Get("admin")
	if adminCtx == nil {
		h.log.Warn("GetProfile blocked - missing admin context", "AuthHandler")
		return apperror.NewUnauthorizedError("Unauthorized")
	}

	adminAuth, ok := adminCtx.(*middleware.AuthContext)
	if !ok {
		h.log.Warn("GetProfile blocked - invalid admin context structure", "AuthHandler")
		return apperror.NewUnauthorizedError("Unauthorized")
	}

	profile, err := h.authUseCase.GetProfile(adminAuth.ID)
	if err != nil {
		h.log.Warn("GetProfile failed - usecase error", "AuthHandler")
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Profile retrieved successfully",
		Data:    profile,
	})
}

func (h *AuthHandler) ChangePassword(c echo.Context) error {
	adminCtx := c.Get("admin")
	if adminCtx == nil {
		h.log.Warn("ChangePassword blocked - missing admin context", "AuthHandler")
		return apperror.NewUnauthorizedError("Unauthorized")
	}

	adminAuth, ok := adminCtx.(*middleware.AuthContext)
	if !ok {
		h.log.Warn("ChangePassword blocked - invalid admin context structure", "AuthHandler")
		return apperror.NewUnauthorizedError("Unauthorized")
	}

	var req dto.ChangePasswordRequest
	if err := c.Bind(&req); err != nil {
		h.log.Warn("ChangePassword failed - invalid request binding", "AuthHandler")
		return err
	}
	if err := c.Validate(&req); err != nil {
		h.log.Warn("ChangePassword failed - input validation failed", "AuthHandler")
		return err
	}

	err := h.authUseCase.ChangePassword(adminAuth.ID, req.OldPassword, req.NewPassword)
	if err != nil {
		h.log.Warn("ChangePassword failed - usecase error: "+err.Error(), "AuthHandler")
		return err
	}

	return c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Password changed successfully",
		Data:    nil,
	})
}
