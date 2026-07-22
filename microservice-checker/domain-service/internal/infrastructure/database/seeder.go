package database

import (
	"encoding/json"
	"io"
	"os"
	"path/filepath"

	"github.com/hidessh99/sub-cf-vpn/microservice-checker/domain-service/internal/infrastructure/config"
	domainDomain "github.com/hidessh99/sub-cf-vpn/microservice-checker/domain-service/internal/module/domain_mgmt/domain"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/domain-service/internal/shared/port"
	"gorm.io/gorm"
)

func SeedDatabase(db *gorm.DB, cfg *config.AppConfig, log port.Logger) error {
	// Paths to public directory containing data JSON files
	cwd, _ := os.Getwd()
	publicDir := filepath.Join(cwd, "..", "public")

	// 3. Import Domains
	var domainCount int64
	if err := db.Model(&domainDomain.DomainEntry{}).Count(&domainCount).Error; err != nil {
		return err
	}

	if domainCount == 0 {
		domainJSONPath := filepath.Join(publicDir, "domain.json")
		if fileExists(domainJSONPath) {
			log.Info("Importing domains from public/domain.json...", "Seed")
			data, err := readJSONFile[[]string](domainJSONPath)
			if err == nil {
				var domains []domainDomain.DomainEntry
				for _, d := range data {
					if d != "" {
						domains = append(domains, domainDomain.DomainEntry{
							Domain:   d,
							IsActive: true,
						})
					}
				}

				if len(domains) > 0 {
					err = db.CreateInBatches(domains, 100).Error
					if err != nil {
						log.Error("Error seeding domains", err, "Seed")
					} else {
						log.Info("Successfully imported domains.", "Seed")
					}
				}
			} else {
				log.Error("Error reading domain.json", err, "Seed")
			}
		}
	}

	return nil
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}

func readJSONFile[T any](path string) (T, error) {
	var result T
	file, err := os.Open(filepath.Clean(path))
	if err != nil {
		return result, err
	}
	defer func() { _ = file.Close() }()

	bytes, err := io.ReadAll(file)
	if err != nil {
		return result, err
	}

	if err := json.Unmarshal(bytes, &result); err != nil {
		return result, err
	}

	return result, nil
}
