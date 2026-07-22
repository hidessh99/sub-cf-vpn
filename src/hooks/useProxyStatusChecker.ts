import { useState, useRef, useEffect, useCallback } from 'react';
import { ProxyItem } from '../types';
import { CONFIG } from '../utils/config';

export interface ProxyStatus {
  status: 'active' | 'dead' | 'loading' | 'unknown';
  latency: number;
}

const CONCURRENCY_LIMIT = 5;
const BATCH_SIZE = 10;

export const getProxyKey = (p: ProxyItem) => `${p.ip}:${p.port}`;

export const useProxyStatusChecker = () => {
  const [proxyStatusMap, setProxyStatusMap] = useState<Record<string, ProxyStatus>>({});
  const checkQueue = useRef<ProxyItem[]>([]);
  const activeChecks = useRef(0);
  const mountedRef = useRef(true);
  const statusMapRef = useRef<Record<string, ProxyStatus>>({});

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Sync state to ref to avoid stale closures
  useEffect(() => {
    statusMapRef.current = proxyStatusMap;
  }, [proxyStatusMap]);

  const processCheckQueue = useCallback(async () => {
    if (
      activeChecks.current >= CONCURRENCY_LIMIT ||
      checkQueue.current.length === 0 ||
      !mountedRef.current
    ) {
      return;
    }

    const proxies = checkQueue.current.splice(0, BATCH_SIZE);
    if (proxies.length === 0) return;

    activeChecks.current++;

    // Mark current batch as loading
    setProxyStatusMap((prev) => {
      const next = { ...prev };
      let changed = false;
      proxies.forEach((p) => {
        const key = getProxyKey(p);
        if (next[key]?.status !== 'active' && next[key]?.status !== 'dead') {
          next[key] = { status: 'loading', latency: 0 };
          changed = true;
        }
      });
      return changed ? next : prev;
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const start = performance.now();

    try {
      const ipList = proxies.map((p) => `${p.ip}:${p.port}`).join(',');
      const res = await fetch(`${CONFIG.apiCheckUrl}${ipList}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();

      const batchLatency = Math.floor(performance.now() - start);
      const results = Array.isArray(data) ? data : [data];

      if (mountedRef.current) {
        setProxyStatusMap((prev) => {
          const next = { ...prev };
          proxies.forEach((p, idx) => {
            const result = results[idx];
            const key = getProxyKey(p);

            if (!result) {
              next[key] = { status: 'dead', latency: 0 };
              return;
            }

            const isActive = result?.proxyip === true;
            const latency = result?.latency || batchLatency;

            next[key] = {
              status: isActive ? 'active' : 'dead',
              latency: isActive ? latency : 0,
            };
          });
          return next;
        });
      }
    } catch {
      if (mountedRef.current) {
        setProxyStatusMap((prev) => {
          const next = { ...prev };
          proxies.forEach((p) => {
            next[getProxyKey(p)] = { status: 'dead', latency: 0 };
          });
          return next;
        });
      }
    } finally {
      activeChecks.current--;
      if (mountedRef.current) {
        timerRef.current = setTimeout(processCheckQueue, 50);
      }
    }
  }, []);

  const queueChecks = useCallback(
    (proxies: ProxyItem[]) => {
      // Add only unchecked proxies to the queue using the Ref to avoid dependency change loops
      const unchecked = proxies.filter((p) => {
        const status = statusMapRef.current[getProxyKey(p)]?.status;
        return !status || status === 'unknown';
      });

      if (unchecked.length > 0) {
        checkQueue.current = [...checkQueue.current, ...unchecked];
        for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
          processCheckQueue();
        }
      }
    },
    [processCheckQueue]
  );

  const clearStatusMap = useCallback(() => {
    setProxyStatusMap({});
    checkQueue.current = [];
  }, []);

  return {
    proxyStatusMap,
    queueChecks,
    clearStatusMap,
  };
};
