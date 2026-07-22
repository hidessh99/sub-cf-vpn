import { useQuery } from '@tanstack/react-query';
import { ProxyItem } from '../types';
import { CONFIG, MAIN_DOMAINS, BUG_LIST } from '../utils/config';

// Parser function to handle both JSON and delimited text responses
const parseProxyList = (text: string): ProxyItem[] => {
  try {
    const json = JSON.parse(text);
    if (Array.isArray(json)) {
      return json
        .map((item) => ({
          ip: item.proxy || '',
          port: String(item.port || ''),
          country: item.country || 'UNK',
          provider: item.asOrganization || 'UNK',
        }))
        .filter((x) => x.ip && x.port);
    }
  } catch {
    // Treat as delimited text
    const lines = text.split(/\r?\n/).filter((x) => x.trim());
    return lines
      .map((line) => {
        const parts = line.split(line.includes('\t') ? '\t' : line.includes('|') ? '|' : ',');
        return parts.length >= 2
          ? {
              ip: parts[0].trim(),
              port: parts[1].trim(),
              country: parts[2]?.trim() || 'UNK',
              provider: parts[3]?.trim() || 'UNK',
            }
          : null;
      })
      .filter((x): x is ProxyItem => x !== null);
  }
  return [];
};

export const useProxies = (customUrl?: string) => {
  const proxyUrl = customUrl || CONFIG.proxyListUrl;

  const proxiesQuery = useQuery({
    queryKey: ['proxies', proxyUrl],
    queryFn: async () => {
      let res = await fetch(proxyUrl);
      if (!res.ok && proxyUrl !== '/proxyip.json') {
        res = await fetch('/proxyip.json');
      }
      if (!res.ok) throw new Error('Failed to load proxy list');
      const text = await res.text();
      return parseProxyList(text);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  const domainsQuery = useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      try {
        let res = await fetch(CONFIG.domainListUrl);
        if (!res.ok && CONFIG.domainListUrl !== '/domain.json') {
          res = await fetch('/domain.json');
        }
        if (!res.ok) throw new Error('Failed to load domains');
        const data = await res.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        return list.length > 0 ? list : MAIN_DOMAINS;
      } catch {
        return MAIN_DOMAINS;
      }
    },
    staleTime: 5 * 1000,
    refetchOnMount: true,
  });

  const bugsQuery = useQuery({
    queryKey: ['bugs'],
    queryFn: async () => {
      try {
        let res = await fetch(CONFIG.bugListUrl);
        if (!res.ok && CONFIG.bugListUrl !== '/bug_list.json') {
          res = await fetch('/bug_list.json');
        }
        if (!res.ok) throw new Error('Failed to load bugs');
        const data = await res.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        return list.length > 0 ? list : BUG_LIST;
      } catch {
        return BUG_LIST;
      }
    },
    staleTime: 5 * 1000,
    refetchOnMount: true,
  });

  return {
    proxies: proxiesQuery.data || [],
    isLoadingProxies: proxiesQuery.isLoading,
    isErrorProxies: proxiesQuery.isError,
    refetchProxies: proxiesQuery.refetch,
    domains: domainsQuery.data || MAIN_DOMAINS,
    bugs: bugsQuery.data || BUG_LIST,
  };
};
