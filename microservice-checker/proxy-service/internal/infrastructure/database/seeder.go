package database

import (
	"encoding/json"
	"io"
	"os"
	"path/filepath"

	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/infrastructure/config"
	proxyDomain "github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/module/proxy/domain"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/proxy-service/internal/shared/port"
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

func SeedDatabase(db *gorm.DB, cfg *config.AppConfig, log port.Logger) error {
	// Paths to public directory containing data JSON files
	cwd, _ := os.Getwd()
	publicDir := filepath.Join(cwd, "..", "public")

	// Import Proxies
	var proxyCount int64
	if err := db.Model(&proxyDomain.Proxy{}).Count(&proxyCount).Error; err != nil {
		return err
	}

	if proxyCount == 0 {
		proxyJSONPath := filepath.Join(publicDir, "proxyip.json")
		if fileExists(proxyJSONPath) {
			log.Info("Importing proxies from public/proxyip.json...", "Seed")
			data, err := readJSONFile[[]proxyImportItem](proxyJSONPath)
			if err == nil {
				var proxies []proxyDomain.Proxy
				for _, p := range data {
					proxies = append(proxies, proxyDomain.Proxy{
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
