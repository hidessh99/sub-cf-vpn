package domain

import "time"

type DomainEntry struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Domain    string    `gorm:"type:text;uniqueIndex:idx_domains_domain;not null" json:"domain"`
	IsActive  bool      `gorm:"column:is_active;type:integer;default:1" json:"is_active"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (DomainEntry) TableName() string {
	return "domains"
}
