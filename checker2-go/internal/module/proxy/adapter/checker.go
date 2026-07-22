package adapter

import (
	"net"
	"strconv"
	"time"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/proxy/domain"
)

type TCPChecker struct{}

func NewTCPChecker() domain.ProxyChecker {
	return &TCPChecker{}
}

func (c *TCPChecker) Check(host string, port int, timeoutMs int) domain.CheckResult {
	start := time.Now()
	address := net.JoinHostPort(host, strconv.Itoa(port))
	timeout := time.Duration(timeoutMs) * time.Millisecond

	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		return domain.CheckResult{
			IP:      host,
			Port:    port,
			ProxyIP: false,
			Latency: 0,
		}
	}
	defer func() { _ = conn.Close() }()

	latency := time.Since(start).Milliseconds()
	return domain.CheckResult{
		IP:      host,
		Port:    port,
		ProxyIP: true,
		Latency: int(latency),
	}
}
