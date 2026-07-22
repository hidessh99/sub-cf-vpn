package domain

type GeoIPResult struct {
	Success        bool    `json:"success"`
	ASN            *int    `json:"asn"`
	ASOrganization *string `json:"as_organization"`
	Country        *string `json:"country"`
	City           *string `json:"city"`
	Region         *string `json:"region"`
	PostalCode     *string `json:"postal_code"`
	Latitude       *string `json:"latitude"`
	Longitude      *string `json:"longitude"`
}

type GeoIPService interface {
	Lookup(ip string) (*GeoIPResult, error)
}

type ProxyChecker interface {
	Check(host string, port int, timeoutMs int) CheckResult
}
