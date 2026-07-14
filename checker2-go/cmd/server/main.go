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

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/infrastructure/config"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/infrastructure/database"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/infrastructure/logger"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/infrastructure/server"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/auth"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/bug"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/dashboard"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/domain_mgmt"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/proxy"
	custommiddleware "github.com/hidessh99/sub-cf-vpn/checker2-go/internal/shared/middleware"
)

func main() {
	// Initialize logger
	log := logger.InitLogger()

	// Load configuration
	cwd, _ := os.Getwd()
	configPath := filepath.Join(cwd, "config.json")
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		// Fallback to example
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

	// Create Echo instance
	e := server.NewEcho(cfg, log)

	// Create context that is cancelled on shutdown
	rootCtx, rootCancel := context.WithCancel(context.Background())
	defer rootCancel()

	// Initialize Modules
	authMod := auth.NewAuthModule(db, cfg, log)
	proxyMod := proxy.NewProxyModule(db, cfg, log)
	domainMod := domain_mgmt.NewDomainModule(db, cfg, log)
	bugMod := bug.NewBugModule(db, cfg, log)

	statsAdapter := dashboard.NewStatsAdapter(proxyMod.Counter, domainMod.Counter, bugMod.Counter)
	dashboardMod := dashboard.NewDashboardModule(statsAdapter, log)

	// Setup CORS
	adminCORS := server.GetAdminCORS(cfg)
	publicCORS := server.GetPublicCORS()

	// 1. System / Public Routes
	server.RegisterSystemRoutes(e, db, log)

	// 2. Auth Module Routes
	authMod.RegisterRoutes(e)

	// 3. Admin API Protected Group (Requires Auth)
	adminGroup := e.Group("/api/v1")
	adminGroup.Use(adminCORS)
	adminGroup.Use(authMod.RequireAuth)

	// 4. Public API Group
	publicAPIGroup := e.Group("/api/v1/public")
	publicAPIGroup.Use(publicCORS)

	// 5. Checker Group (Rate limited)
	checkerGroup := e.Group("/api")
	checkerGroup.Use(publicCORS)
	checkerGroup.Use(custommiddleware.CheckerRateLimiter.Limit())

	// Register Routes
	proxyMod.RegisterRoutes(adminGroup, publicAPIGroup, checkerGroup)
	domainMod.RegisterRoutes(adminGroup, publicAPIGroup)
	bugMod.RegisterRoutes(adminGroup, publicAPIGroup)
	dashboardMod.RegisterRoutes(adminGroup)

	// Start proxy health check cron/ticker
	var cronWG sync.WaitGroup
	proxyMod.StartHealthCron(rootCtx, &cronWG)

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

	// 2. Close Database Connection
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
