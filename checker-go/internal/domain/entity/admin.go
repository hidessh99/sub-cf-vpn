package entity

import "time"

type Admin struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Username  string    `gorm:"type:text;uniqueIndex;not null" json:"username"`
	Password  string    `gorm:"type:text;not null" json:"password,omitempty"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Admin) TableName() string {
	return "admins"
}
