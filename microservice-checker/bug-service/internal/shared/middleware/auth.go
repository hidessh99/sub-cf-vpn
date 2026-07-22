package middleware

import (
	"net/http"
	"strings"

	"github.com/hidessh99/sub-cf-vpn/microservice-checker/bug-service/internal/infrastructure/config"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/bug-service/internal/shared/dto"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/bug-service/pkg/jwt"
	"github.com/labstack/echo/v4"
)

type AuthContext struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
}

func authenticateRequest(c echo.Context, cfg *config.AppConfig) (*AuthContext, error) {
	authHeader := c.Request().Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "Missing or invalid token")
	}

	token := authHeader[7:]
	claims, err := jwt.VerifyToken(token, cfg.JWT.Secret)
	if err != nil {
		return nil, err
	}

	// Parse claims
	var idVal uint
	if idClaim, ok := claims["id"]; ok {
		switch v := idClaim.(type) {
		case float64:
			if v >= 0 {
				idVal = uint(v)
			}
		case int:
			if v >= 0 {
				idVal = uint(v)
			}
		}
	}

	usernameVal := ""
	if usernameClaim, ok := claims["username"]; ok {
		usernameVal, _ = usernameClaim.(string)
	}

	if idVal == 0 || usernameVal == "" {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "Invalid token claims")
	}

	return &AuthContext{
		ID:       idVal,
		Username: usernameVal,
	}, nil
}

func RequireAuth(cfg *config.AppConfig) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authCtx, err := authenticateRequest(c, cfg)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, dto.APIResponse{
					Success: false,
					Message: "Unauthorized",
					Error:   nil,
				})
			}
			c.Set("admin", authCtx)
			return next(c)
		}
	}
}

func OptionalAuth(cfg *config.AppConfig) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authCtx, err := authenticateRequest(c, cfg)
			if err == nil {
				c.Set("admin", authCtx)
			} else {
				c.Set("admin", nil)
			}
			return next(c)
		}
	}
}
