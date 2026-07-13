package dto

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
	Errors  []string    `json:"errors,omitempty"`
	Error   interface{} `json:"error"` // matching hono error output format where error is null or string
}

type PaginationInfo struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"totalPages"`
}

type PaginatedResponse struct {
	Success    bool           `json:"success"`
	Data       interface{}    `json:"data"`
	Pagination PaginationInfo `json:"pagination"`
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
