package dto

type CreateDomainRequest struct {
	Domain string `json:"domain" validate:"required"`
}
