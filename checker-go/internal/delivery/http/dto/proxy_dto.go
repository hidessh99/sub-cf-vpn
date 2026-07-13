package dto

type CreateProxyRequest struct {
	Proxy           *string `json:"proxy"`
	Port            *string `json:"port"`
	ProxyIP         *bool   `json:"proxyip"`
	IP              string  `json:"ip" validate:"required"`
	Latency         *int    `json:"latency"`
	ASN             *int    `json:"asn"`
	ASOrganization  *string `json:"asOrganization"`  // camelCase
	ASOrgSnake      *string `json:"as_organization"` // snake_case fallback
	Colo            *string `json:"colo"`
	Country         *string `json:"country"`
	City            *string `json:"city"`
	Region          *string `json:"region"`
	PostalCode      *string `json:"postalCode"`      // camelCase
	PostalCodeSnake *string `json:"postal_code"`      // snake_case fallback
	Latitude        *string `json:"latitude"`
	Longitude       *string `json:"longitude"`
	IsActive        *bool   `json:"is_active"`
}

type UpdateProxyRequest struct {
	Proxy           *string `json:"proxy"`
	Port            *string `json:"port"`
	ProxyIP         *bool   `json:"proxyip"`
	IP              *string `json:"ip"`
	Latency         *int    `json:"latency"`
	ASN             *int    `json:"asn"`
	ASOrganization  *string `json:"asOrganization"`
	ASOrgSnake      *string `json:"as_organization"`
	Colo            *string `json:"colo"`
	Country         *string `json:"country"`
	City            *string `json:"city"`
	Region          *string `json:"region"`
	PostalCode      *string `json:"postalCode"`
	PostalCodeSnake *string `json:"postal_code"`
	Latitude        *string `json:"latitude"`
	Longitude       *string `json:"longitude"`
	IsActive        *bool   `json:"is_active"`
}

type ImportProxyListRequest struct {
	Proxies []CreateProxyRequest `json:"proxies" validate:"required,dive"`
}

type PublicProxyItem struct {
	Proxy          string  `json:"proxy"`
	Port           string  `json:"port"`
	ProxyIP        bool    `json:"proxyip"`
	IP             string  `json:"ip"`
	Latency        int     `json:"latency"`
	ASN            *int    `json:"asn"`
	ASOrganization *string `json:"asOrganization"` // camelCase matching frontend expectation
	Colo           *string `json:"colo"`
	Country        *string `json:"country"`
	City           *string `json:"city"`
	Region         *string `json:"region"`
	PostalCode     *string `json:"postalCode"`     // camelCase matching frontend expectation
	Latitude       *string `json:"latitude"`
	Longitude      *string `json:"longitude"`
}
