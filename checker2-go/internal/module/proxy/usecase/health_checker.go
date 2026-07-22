package usecase

import (
	"context"
	"net"
	"strconv"
	"strings"
	"sync"

	"github.com/hidessh99/sub-cf-vpn/checker2-go/internal/module/proxy/domain"
	"github.com/hidessh99/sub-cf-vpn/checker2-go/pkg/ipvalidator"
)

func (u *proxyUseCase) SyncHealthCheck(ctx context.Context) {
	go u.RunHealthCheckCycle(context.WithoutCancel(ctx))
}

func (u *proxyUseCase) RunHealthCheckCycle(ctx context.Context) {
	u.mu.Lock()
	if u.isChecking {
		u.mu.Unlock()
		u.log.Info("Health check cycle is already running. Skipping.", "CronCheck")
		return
	}
	u.isChecking = true
	u.mu.Unlock()

	defer func() {
		u.mu.Lock()
		u.isChecking = false
		u.mu.Unlock()
	}()

	batchSize := u.cfg.CronCheck.BatchSize
	if batchSize <= 0 {
		batchSize = 20
	}
	timeoutMs := u.cfg.CronCheck.TimeoutMs
	if timeoutMs <= 0 {
		timeoutMs = 3000
	}

	u.log.Info("Starting proxy health check cycle...", "CronCheck")

	activeProxies, err := u.proxyRepo.FindAllActive(ctx)
	if err != nil {
		u.log.Error("Failed to fetch active proxies for health check", err, "CronCheck")
		return
	}

	if len(activeProxies) == 0 {
		u.log.Info("No active proxies found in database. Cycle finished.", "CronCheck")
		return
	}

	u.log.Info(strings.ReplaceAll("Found {count} active proxies to check.", "{count}", strconv.Itoa(len(activeProxies))), "CronCheck")

	var deadIds []uint
	var deadMu sync.Mutex

	for i := 0; i < len(activeProxies); i += batchSize {
		select {
		case <-ctx.Done():
			u.log.Info("Health check cycle cancelled due to server shutdown.", "CronCheck")
			return
		default:
		}

		end := i + batchSize
		if end > len(activeProxies) {
			end = len(activeProxies)
		}
		batch := activeProxies[i:end]

		var wg sync.WaitGroup
		for _, p := range batch {
			wg.Add(1)
			go func(proxy domain.Proxy) {
				defer wg.Done()

				select {
				case <-ctx.Done():
					return
				default:
				}

				host := proxy.Proxy
				if host == "" {
					host = proxy.IP
				}

				if h, _, err := net.SplitHostPort(host); err == nil {
					host = h
				}

				if ipvalidator.IsPrivateIP(host) {
					u.log.Warn("Cron check blocked private IP range proxy: "+host+":"+proxy.Port+". Marking as dead.", "CronCheck")
					deadMu.Lock()
					deadIds = append(deadIds, proxy.ID)
					deadMu.Unlock()
					return
				}

				port, err := strconv.Atoi(strings.TrimSpace(proxy.Port))
				if err != nil || port <= 0 {
					port = 443
				}

				proxyAddr := host + ":" + strconv.Itoa(port)
				u.log.Info("Checking proxy: " + proxyAddr, "CronCheck")

				res := u.proxyChecker.Check(host, port, timeoutMs)
				if !res.ProxyIP {
					u.log.Warn("Proxy check failed (dead): " + proxyAddr + " - latency: " + strconv.Itoa(res.Latency) + "ms", "CronCheck")
					deadMu.Lock()
					deadIds = append(deadIds, proxy.ID)
					deadMu.Unlock()
				} else {
					u.log.Info("Proxy check success (alive): " + proxyAddr + " - latency: " + strconv.Itoa(res.Latency) + "ms", "CronCheck")
				}
			}(p)
		}
		wg.Wait()
	}

	if len(deadIds) > 0 {
		u.log.Warn("Found dead proxies. Removing from SQLite database...", "CronCheck")
		deleted, err := u.proxyRepo.BulkDelete(ctx, deadIds)
		if err != nil {
			u.log.Error("Error bulk deleting dead proxies", err, "CronCheck")
		} else {
			u.log.Info("Successfully removed dead proxies.", "CronCheck")
			_ = deleted
		}
	} else {
		u.log.Info("All checked proxies are alive!", "CronCheck")
	}

	u.log.Info("Health check cycle complete.", "CronCheck")
}
