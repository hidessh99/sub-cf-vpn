package geoip

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/apperror"
	"github.com/hidessh99/sub-cf-vpn/checker-go/internal/pkg/ipvalidator"
)

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

type IGeoIPService interface {
	Lookup(ip string) (*GeoIPResult, error)
}

type GeoIPService struct {
	client *http.Client
}

func NewGeoIPService() IGeoIPService {
	return &GeoIPService{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

type ipWhoIsResponse struct {
	Success    bool   `json:"success"`
	Message    string `json:"message"`
	Country    string `json:"country_code"`
	City       string `json:"city"`
	Region     string `json:"region"`
	Postal     string `json:"postal"`
	Latitude   float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
	Connection struct {
		ASN int    `json:"asn"`
		Org string `json:"org"`
		ISP string `json:"isp"`
	} `json:"connection"`
}

type freeIPAPIResponse struct {
	ASN         interface{} `json:"asn"`
	ASName      string      `json:"asName"`
	CountryCode string      `json:"countryCode"`
	CityName    string      `json:"cityName"`
	RegionName  string      `json:"regionName"`
	ZipCode     string      `json:"zipCode"`
	Latitude    float64     `json:"latitude"`
	Longitude   float64     `json:"longitude"`
}

func (s *GeoIPService) Lookup(ip string) (*GeoIPResult, error) {
	cleanIp := ipvalidator.ExtractIP(ip)

	if ipvalidator.IsPrivateIP(cleanIp) {
		return nil, apperror.NewValidationError("Cannot lookup GeoIP for private IP addresses")
	}

	// Try Primary Provider: ipwho.is
	result, err := s.lookupIpWhoIs(cleanIp)
	if err == nil {
		return result, nil
	}

	// Try Fallback: freeipapi.com
	return s.lookupFreeIPAPI(cleanIp)
}

func (s *GeoIPService) lookupIpWhoIs(ip string) (*GeoIPResult, error) {
	url := fmt.Sprintf("https://ipwho.is/%s", ip)
	resp, err := s.client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ipwho.is returned status %d", resp.StatusCode)
	}

	var data ipWhoIsResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	if !data.Success {
		return nil, errors.New(data.Message)
	}

	asOrg := data.Connection.Org
	if asOrg == "" {
		asOrg = data.Connection.ISP
	}

	country := data.Country
	if country == "" {
		country = "UNK"
	}

	latStr := strconv.FormatFloat(data.Latitude, 'f', -1, 64)
	lonStr := strconv.FormatFloat(data.Longitude, 'f', -1, 64)

	return &GeoIPResult{
		Success:        true,
		ASN:            &data.Connection.ASN,
		ASOrganization: &asOrg,
		Country:        &country,
		City:           &data.City,
		Region:         &data.Region,
		PostalCode:     &data.Postal,
		Latitude:       &latStr,
		Longitude:      &lonStr,
	}, nil
}

func (s *GeoIPService) lookupFreeIPAPI(ip string) (*GeoIPResult, error) {
	url := fmt.Sprintf("https://freeipapi.com/api/json/%s", ip)
	resp, err := s.client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("freeipapi.com returned status %d", resp.StatusCode)
	}

	var data freeIPAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	var asnVal int
	switch v := data.ASN.(type) {
	case float64:
		asnVal = int(v)
	case int:
		asnVal = v
	case string:
		if val, err := strconv.Atoi(v); err == nil {
			asnVal = val
		}
	}

	country := data.CountryCode
	if country == "" {
		country = "UNK"
	}

	latStr := strconv.FormatFloat(data.Latitude, 'f', -1, 64)
	lonStr := strconv.FormatFloat(data.Longitude, 'f', -1, 64)

	return &GeoIPResult{
		Success:        true,
		ASN:            &asnVal,
		ASOrganization: &data.ASName,
		Country:        &country,
		City:           &data.CityName,
		Region:         &data.RegionName,
		PostalCode:     &data.ZipCode,
		Latitude:       &latStr,
		Longitude:      &lonStr,
	}, nil
}
