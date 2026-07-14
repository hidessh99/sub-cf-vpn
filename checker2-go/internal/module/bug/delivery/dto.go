package delivery

type CreateBugRequest struct {
	Hostname string `json:"hostname" validate:"required"`
}
