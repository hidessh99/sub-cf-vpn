package config

import (
	"log"
	"strings"

	"github.com/spf13/viper"
)

type JWTConfig struct {
	Secret    string `mapstructure:"secret"`
	ExpiresIn string `mapstructure:"expiresIn"`
}

type AdminConfig struct {
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
}

type CronCheckConfig struct {
	Enabled       bool `mapstructure:"enabled"`
	IntervalHours int  `mapstructure:"intervalHours"`
	BatchSize     int  `mapstructure:"batchSize"`
	TimeoutMs     int  `mapstructure:"timeoutMs"`
}

type AppConfig struct {
	Port      int             `mapstructure:"port"`
	JWT       JWTConfig       `mapstructure:"jwt"`
	Admin     AdminConfig     `mapstructure:"admin"`
	CronCheck CronCheckConfig `mapstructure:"cronCheck"`
}

func LoadConfig(path string) (*AppConfig, error) {
	viper.SetConfigFile(path)
	viper.SetConfigType("json")

	// Set environment variable overrides
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// Default settings
	viper.SetDefault("port", 4002)
	viper.SetDefault("jwt.expiresIn", "24h")
	viper.SetDefault("admin.username", "admin")
	viper.SetDefault("admin.password", "admin123")
	viper.SetDefault("cronCheck.enabled", false)
	viper.SetDefault("cronCheck.intervalHours", 24)
	viper.SetDefault("cronCheck.batchSize", 20)
	viper.SetDefault("cronCheck.timeoutMs", 3000)

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Warning: Failed to read config file (%s), using environment or default variables\n", err)
	}

	var config AppConfig
	if err := viper.Unmarshal(&config); err != nil {
		return nil, err
	}

	return &config, nil
}
