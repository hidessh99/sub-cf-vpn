package entity

import "time"

type Bug struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Hostname  string    `gorm:"type:text;uniqueIndex:idx_bugs_hostname;not null" json:"hostname"`
	IsActive  bool      `gorm:"column:is_active;type:integer;default:1" json:"is_active"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (Bug) TableName() string {
	return "bugs"
}
