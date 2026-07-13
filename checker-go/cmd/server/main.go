package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"sync"
	"syscall"
	"time"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/config"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/delivery/http/router"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/container"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/database"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/logger"
	"github.com/labstack/echo/v4"
)

func main() {
	// Initialize logger
	log := logger.InitLogger()

	// Load configuration
	cwd, _ := os.Getwd()
	configPath := filepath.Join(cwd, "config.json")
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		// Fallback to example or environment
		configPath = filepath.Join(cwd, "config.example.json")
	}

	cfg, err := config.LoadConfig(configPath)
	if err != nil {
		log.Error("Failed to load configuration", err, "System")
		os.Exit(1)
	}

	// Initialize SQLite database
	dbPath := filepath.Join(cwd, "data", "admin.db")
	log.Info("Running database migrations...", "System")
	db, err := database.InitDatabase(dbPath)
	if err != nil {
		log.Error("Database initialization failed", err, "System")
		os.Exit(1)
	}

	// Run seeder
	log.Info("Seeding database...", "System")
	err = database.SeedDatabase(db, cfg, log)
	if err != nil {
		log.Error("Failed to seed database", err, "System")
	} else {
		log.Info("Seeding complete.", "System")
	}

	// Setup dependency injection container
	c := container.Wire(db, cfg, log)

	// Create Echo instance
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	// Create context that is cancelled on shutdown
	rootCtx, rootCancel := context.WithCancel(context.Background())
	defer rootCancel()

	// Setup routes and middlewares
	router.SetupRouter(e, c)

	// Start proxy health check cron/ticker
	var cronWG sync.WaitGroup
	startProxyHealthCron(rootCtx, c, &cronWG)

	// Start Echo HTTP server
	port := cfg.Port
	log.Info(fmt.Sprintf("Service running on http://0.0.0.0:%d", port), "System")
	go func() {
		if err := e.Start(fmt.Sprintf(":%d", port)); err != nil && err != http.ErrServerClosed {
			log.Error("HTTP server failed to start", err, "System")
			os.Exit(1)
		}
	}()

	// Graceful shutdown handling
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Shutdown signal received. Starting graceful shutdown...", "System")

	// Cancel background context and wait for active checks to finish
	rootCancel()
	cronWG.Wait()
	log.Info("Background cron check tasks stopped.", "CronCheck")

	// 1. Shutdown HTTP server (timeout 10 seconds)
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := e.Shutdown(shutdownCtx); err != nil {
		log.Error("HTTP server shutdown error", err, "System")
	} else {
		log.Info("HTTP server stopped accepting new connections.", "System")
	}

	// 2. Close GORM/SQL Database Connection
	sqlDB, err := db.DB()
	if err == nil {
		if err = sqlDB.Close(); err != nil {
			log.Error("Error closing SQLite connection", err, "System")
		} else {
			log.Info("SQLite database connection closed safely.", "System")
		}
	}

	log.Info("Graceful shutdown complete. Exiting process.", "System")
}

func startProxyHealthCron(ctx context.Context, c *container.Container, wg *sync.WaitGroup) {
	cronConfig := c.Config.CronCheck
	if !cronConfig.Enabled {
		c.Logger.Info("Cron check is disabled in config.", "CronCheck")
		return
	}

	intervalHours := cronConfig.IntervalHours
	if intervalHours <= 0 {
		intervalHours = 24
	}

	c.Logger.Info(fmt.Sprintf("Proxy health check scheduled every %d hours.", intervalHours), "CronCheck")

	// Trigger initial run after 5 seconds
	wg.Add(1)
	go func() {
		defer wg.Done()
		select {
		case <-ctx.Done():
			return
		case <-time.After(5 * time.Second):
			c.ProxyUseCase.RunHealthCheckCycle(ctx)
		}
	}()

	// Ticker for subsequent runs
	ticker := time.NewTicker(time.Duration(intervalHours) * time.Hour)
	wg.Add(1)
	go func() {
		defer wg.Done()
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				c.Logger.Info("Cron checker ticker stopped.", "CronCheck")
				return
			case <-ticker.C:
				c.ProxyUseCase.RunHealthCheckCycle(ctx)
			}
		}
	}()
}
