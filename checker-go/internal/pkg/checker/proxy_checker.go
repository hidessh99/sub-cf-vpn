package checker

import (
	"net"
	"strconv"
	"time"
)

type CheckResult struct {
	IP      string `json:"ip"`
	Port    int    `json:"port"`
	ProxyIP bool   `json:"proxyip"`
	Latency int    `json:"latency"`
}

func CheckProxy(ip string, port int, timeoutMs int) CheckResult {
	start := time.Now()
	address := net.JoinHostPort(ip, strconv.Itoa(port))
	timeout := time.Duration(timeoutMs) * time.Millisecond

	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		return CheckResult{
			IP:      ip,
			Port:    port,
			ProxyIP: false,
			Latency: 0,
		}
	}
	defer func() { _ = conn.Close() }()

	latency := time.Since(start).Milliseconds()
	return CheckResult{
		IP:      ip,
		Port:    port,
		ProxyIP: true,
		Latency: int(latency),
	}
}
