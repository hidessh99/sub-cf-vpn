package database

import (
	"os"
	"path/filepath"
	"time"

	"github.com/glebarez/sqlite"
	proxyDomain "github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/module/proxy/domain"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

func InitDatabase(dbPath string) (*gorm.DB, error) {
	// Ensure directory exists
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0750); err != nil {
		return nil, err
	}

	// Setup GORM SQLite connection
	config := &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Silent),
	}

	db, err := gorm.Open(sqlite.Open(dbPath), config)
	if err != nil {
		return nil, err
	}

	// Get generic database object to run custom PRAGMAs
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// PRAGMA setup for optimal performance
	if _, err := sqlDB.Exec("PRAGMA journal_mode = WAL;"); err != nil {
		return nil, err
	}
	if _, err := sqlDB.Exec("PRAGMA foreign_keys = ON;"); err != nil {
		return nil, err
	}
	if _, err := sqlDB.Exec("PRAGMA busy_timeout = 5000;"); err != nil {
		return nil, err
	}

	// GORM SQLite connection pool limits to prevent database lock contention
	sqlDB.SetMaxOpenConns(1)
	sqlDB.SetMaxIdleConns(1)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Auto Migration
	err = db.AutoMigrate(
		&proxyDomain.Proxy{},
	)
	if err != nil {
		return nil, err
	}

	return db, nil
}
