package delivery

type CreateDomainRequest struct {
	Domain string `json:"domain" validate:"required"`
}
