package middleware

import (
	"fmt"
	"time"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/logger"
	"github.com/labstack/echo/v4"
)

func RequestLogger(log *logger.LogrusLogger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			req := c.Request()
			res := c.Response()

			reqID := req.Header.Get(echo.HeaderXRequestID)
			if reqID == "" {
				reqID = res.Header().Get(echo.HeaderXRequestID)
			}

			method := req.Method
			path := req.URL.Path

			log.Info(fmt.Sprintf("[ReqId: %s] --> %s %s", reqID, method, path), "HTTP")

			start := time.Now()
			err := next(c)
			duration := time.Since(start).Milliseconds()

			status := res.Status
			if err != nil {
				if he, ok := err.(*echo.HTTPError); ok {
					status = he.Code
				}
			}

			log.Info(fmt.Sprintf("[ReqId: %s] <-- %s %s %d - %dms", reqID, method, path, status, duration), "HTTP")

			return err
		}
	}
}
