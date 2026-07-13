package dto

type CreateBugRequest struct {
	Hostname string `json:"hostname" validate:"required"`
}
