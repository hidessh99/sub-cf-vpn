package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/shared/dto"
	"github.com/labstack/echo/v4"
)

type rateLimitEntry struct {
	count     int
	resetTime time.Time
}

type RateLimiter struct {
	store     sync.Map
	window    time.Duration
	max       int
	message   string
	keyPrefix string
}

func NewRateLimiter(window time.Duration, max int, message string, keyPrefix string) *RateLimiter {
	rl := &RateLimiter{
		window:    window,
		max:       max,
		message:   message,
		keyPrefix: keyPrefix,
	}

	// Periodic cleanup worker in background to prevent memory leak
	go func() {
		ticker := time.NewTicker(window * 2)
		for range ticker.C {
			now := time.Now()
			rl.store.Range(func(key, value interface{}) bool {
				entry := value.(*rateLimitEntry)
				if entry.resetTime.Before(now) {
					rl.store.Delete(key)
				}
				return true
			})
		}
	}()

	return rl
}

func (rl *RateLimiter) Limit() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			ip := c.Request().Header.Get("X-Forwarded-For")
			if ip == "" {
				ip = c.Request().Header.Get("X-Real-IP")
			}
			if ip == "" {
				ip = c.RealIP()
			}

			key := fmt.Sprintf("%s-%s", rl.keyPrefix, ip)
			now := time.Now()

			var entry *rateLimitEntry
			val, loaded := rl.store.Load(key)
			if !loaded {
				entry = &rateLimitEntry{
					count:     0,
					resetTime: now.Add(rl.window),
				}
			} else {
				entry = val.(*rateLimitEntry)
				if entry.resetTime.Before(now) {
					entry = &rateLimitEntry{
						count:     0,
						resetTime: now.Add(rl.window),
					}
				}
			}

			entry.count++
			rl.store.Store(key, entry)

			res := c.Response()
			res.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", rl.max))
			remaining := rl.max - entry.count
			if remaining < 0 {
				remaining = 0
			}
			res.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
			res.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", entry.resetTime.Unix()))

			if entry.count > rl.max {
				return c.JSON(http.StatusTooManyRequests, dto.APIResponse{
					Success: false,
					Message: rl.message,
					Error:   nil,
				})
			}

			return next(c)
		}
	}
}

// Global rate limiters matching TS definitions
var (
	LoginRateLimiter = NewRateLimiter(
		15*time.Minute,
		5,
		"Too many login attempts from this IP, please try again after 15 minutes.",
		"login",
	)

	CheckerRateLimiter = NewRateLimiter(
		60*time.Second,
		60,
		"Too many proxy check requests from this IP, please try again after a minute.",
		"checker",
	)
)
