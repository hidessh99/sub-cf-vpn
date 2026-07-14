package domain

import "time"

type Proxy struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Proxy          string    `gorm:"type:text;not null" json:"proxy"`
	Port           string    `gorm:"type:text;default:'443'" json:"port"`
	ProxyIP        bool      `gorm:"column:proxyip;type:integer;default:1" json:"proxyip"`
	IP             string    `gorm:"type:text;not null;index:idx_proxies_ip" json:"ip"`
	Latency        int       `gorm:"type:integer;default:0" json:"latency"`
	ASN            *int      `gorm:"type:integer" json:"asn"`
	ASOrganization *string   `gorm:"column:as_organization;type:text" json:"as_organization"`
	Colo           *string   `gorm:"type:text" json:"colo"`
	Country        *string   `gorm:"type:text;index:idx_proxies_country" json:"country"`
	City           *string   `gorm:"type:text" json:"city"`
	Region         *string   `gorm:"type:text" json:"region"`
	PostalCode     *string   `gorm:"column:postal_code;type:text" json:"postal_code"`
	Latitude       *string   `gorm:"type:text" json:"latitude"`
	Longitude      *string   `gorm:"type:text" json:"longitude"`
	IsActive       bool      `gorm:"column:is_active;type:integer;default:1;index:idx_proxies_is_active" json:"is_active"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Proxy) TableName() string {
	return "proxies"
}

type CheckResult struct {
	IP      string `json:"ip"`
	Port    int    `json:"port"`
	ProxyIP bool   `json:"proxyip"`
	Latency int    `json:"latency"`
}
