package database

import (
	"encoding/json"
	"io"
	"os"
	"path/filepath"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/config"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/domain/entity"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/infrastructure/logger"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/password"
	"gorm.io/gorm"
)

type proxyImportItem struct {
	Proxy          string  `json:"proxy"`
	Port           string  `json:"port"`
	ProxyIP        bool    `json:"proxyip"`
	IP             string  `json:"ip"`
	Latency        int     `json:"latency"`
	ASN            *int    `json:"asn"`
	ASOrganization *string `json:"asOrganization"`
	Colo           *string `json:"colo"`
	Country        *string `json:"country"`
	City           *string `json:"city"`
	Region         *string `json:"region"`
	PostalCode     *string `json:"postalCode"`
	Latitude       *string `json:"latitude"`
	Longitude      *string `json:"longitude"`
}

func SeedDatabase(db *gorm.DB, cfg *config.AppConfig, log *logger.LogrusLogger) error {
	// 1. Seed Admin
	var adminCount int64
	if err := db.Model(&entity.Admin{}).Count(&adminCount).Error; err != nil {
		return err
	}

	if adminCount == 0 {
		username := cfg.Admin.Username
		plainPassword := cfg.Admin.Password
		if plainPassword == "" {
			plainPassword = "admin123"
		}

		hashed, err := password.HashPassword(plainPassword)
		if err != nil {
			return err
		}

		admin := entity.Admin{
			Username: username,
			Password: hashed,
		}

		if err := db.Create(&admin).Error; err != nil {
			return err
		}
		log.Info("Created default admin user.", "Seed")
	}

	// Paths to public directory containing data JSON files
	cwd, _ := os.Getwd()
	publicDir := filepath.Join(cwd, "..", "public")

	// 2. Import Proxies
	var proxyCount int64
	if err := db.Model(&entity.Proxy{}).Count(&proxyCount).Error; err != nil {
		return err
	}

	if proxyCount == 0 {
		proxyJSONPath := filepath.Join(publicDir, "proxyip.json")
		if fileExists(proxyJSONPath) {
			log.Info("Importing proxies from public/proxyip.json...", "Seed")
			data, err := readJSONFile[[]proxyImportItem](proxyJSONPath)
			if err == nil {
				var proxies []entity.Proxy
				for _, p := range data {
					proxies = append(proxies, entity.Proxy{
						Proxy:          p.Proxy,
						Port:           p.Port,
						ProxyIP:        p.ProxyIP,
						IP:             p.IP,
						Latency:        p.Latency,
						ASN:            p.ASN,
						ASOrganization: p.ASOrganization,
						Colo:           p.Colo,
						Country:        p.Country,
						City:           p.City,
						Region:         p.Region,
						PostalCode:     p.PostalCode,
						Latitude:       p.Latitude,
						Longitude:      p.Longitude,
						IsActive:       true,
					})
				}

				if len(proxies) > 0 {
					err = db.CreateInBatches(proxies, 100).Error
					if err != nil {
						log.Error("Error seeding proxies", err, "Seed")
					} else {
						log.Info("Successfully imported proxies.", "Seed")
					}
				}
			} else {
				log.Error("Error reading proxyip.json", err, "Seed")
			}
		}
	}

	// 3. Import Domains
	var domainCount int64
	if err := db.Model(&entity.DomainEntry{}).Count(&domainCount).Error; err != nil {
		return err
	}

	if domainCount == 0 {
		domainJSONPath := filepath.Join(publicDir, "domain.json")
		if fileExists(domainJSONPath) {
			log.Info("Importing domains from public/domain.json...", "Seed")
			data, err := readJSONFile[[]string](domainJSONPath)
			if err == nil {
				var domains []entity.DomainEntry
				for _, d := range data {
					if d != "" {
						domains = append(domains, entity.DomainEntry{
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

	// 4. Import Bugs
	var bugCount int64
	if err := db.Model(&entity.Bug{}).Count(&bugCount).Error; err != nil {
		return err
	}

	if bugCount == 0 {
		bugJSONPath := filepath.Join(publicDir, "bug_list.json")
		if fileExists(bugJSONPath) {
			log.Info("Importing bugs from public/bug_list.json...", "Seed")
			data, err := readJSONFile[[]string](bugJSONPath)
			if err == nil {
				var bugs []entity.Bug
				for _, b := range data {
					if b != "" {
						bugs = append(bugs, entity.Bug{
							Hostname: b,
							IsActive: true,
						})
					}
				}

				if len(bugs) > 0 {
					err = db.CreateInBatches(bugs, 100).Error
					if err != nil {
						log.Error("Error seeding bugs", err, "Seed")
					} else {
						log.Info("Successfully imported bugs.", "Seed")
					}
				}
			} else {
				log.Error("Error reading bug_list.json", err, "Seed")
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
	file, err := os.Open(filepath.Clean(path)) // nolint:gosec
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
