package database

import (
	"encoding/json"
	"io"
	"os"
	"path/filepath"

	"github.com/hidessh99/sub-cf-vpn/microservice-checker/bug-service/internal/infrastructure/config"
	bugDomain "github.com/hidessh99/sub-cf-vpn/microservice-checker/bug-service/internal/module/bug/domain"
	"github.com/hidessh99/sub-cf-vpn/microservice-checker/bug-service/internal/shared/port"
	"gorm.io/gorm"
)

func SeedDatabase(db *gorm.DB, cfg *config.AppConfig, log port.Logger) error {
	// Paths to public directory containing data JSON files
	cwd, _ := os.Getwd()
	publicDir := filepath.Join(cwd, "..", "public")

	// 4. Import Bugs
	var bugCount int64
	if err := db.Model(&bugDomain.Bug{}).Count(&bugCount).Error; err != nil {
		return err
	}

	if bugCount == 0 {
		bugJSONPath := filepath.Join(publicDir, "bug_list.json")
		if fileExists(bugJSONPath) {
			log.Info("Importing bugs from public/bug_list.json...", "Seed")
			data, err := readJSONFile[[]string](bugJSONPath)
			if err == nil {
				var bugs []bugDomain.Bug
				for _, b := range data {
					if b != "" {
						bugs = append(bugs, bugDomain.Bug{
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
