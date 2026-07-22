package middleware

import (
	"os"

	"github.com/labstack/echo/v4"
)

func SecurityHeaders() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			res := c.Response()
			res.Header().Set("X-Content-Type-Options", "nosniff")
			res.Header().Set("X-Frame-Options", "DENY")
			res.Header().Set("X-XSS-Protection", "1; mode=block")
			res.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

			if os.Getenv("NODE_ENV") == "production" {
				res.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
			}

			return next(c)
		}
	}
}
