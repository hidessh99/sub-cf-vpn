import React, { useState, useEffect, useMemo } from 'react';
import { Search, Globe, ChevronDown, Link2, RotateCw, Ghost, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProxyItem } from '../../types';
import { ProxyRow } from './ProxyRow';
import { ProxyStatus, getProxyKey } from '../../hooks/useProxyStatusChecker';

interface ProxyListProps {
  proxies: ProxyItem[];
  isLoading: boolean;
  proxyStatusMap: Record<string, ProxyStatus>;
  selectedProxy: ProxyItem | null;
  onSelectProxy: (p: ProxyItem) => void;
  customUrl: string;
  setCustomUrl: (url: string) => void;
  onReload: (url: string) => void;
  queueChecks: (proxies: ProxyItem[]) => void;
}

const ITEMS_PER_PAGE = 20;

export const ProxyList: React.FC<ProxyListProps> = ({
  proxies,
  isLoading,
  proxyStatusMap,
  selectedProxy,
  onSelectProxy,
  customUrl,
  setCustomUrl,
  onReload,
  queueChecks,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [customUrlMode, setCustomUrlMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Available countries derived from raw proxies list
  const availableCountries = useMemo(() => {
    const countries = proxies.map(p => p.country);
    const unique = Array.from(new Set(countries)).sort();
    return ['All', ...unique];
  }, [proxies]);

  // Filtered proxies based on search query and selected country
  const filteredProxies = useMemo(() => {
    let result = [...proxies];

    if (selectedCountry !== 'All') {
      result = result.filter(p => p.country === selectedCountry);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.provider.toLowerCase().includes(query) ||
        p.ip.includes(query)
      );
    }

    return result;
  }, [proxies, searchQuery, selectedCountry]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCountry]);

  const totalPages = Math.ceil(filteredProxies.length / ITEMS_PER_PAGE);

  // Sliced proxies to display for current page
  const displayedProxies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProxies.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProxies, currentPage]);

  // Queue checking for displayed proxies when they change
  useEffect(() => {
    if (displayedProxies.length > 0) {
      queueChecks(displayedProxies);
    }
  }, [displayedProxies, queueChecks]);

  return (
    <div className="gento-card rounded-3xl flex flex-col h-full overflow-hidden">
      {/* Top Search & Filter Bar */}
      <div className="p-4 border-b border-white/5 space-y-3 bg-slate-900/40 flex-none">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-3.5 text-slate-500 h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="gento-input w-full rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder-slate-500"
              placeholder="Cari Provider..."
            />
          </div>

          <button
            onClick={() => setCustomUrlMode(!customUrlMode)}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all flex-none ${
              customUrlMode
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border-purple-500/30'
            }`}
            title="Custom URL"
          >
            <Link2 className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onReload(customUrl)}
            className="w-10 h-10 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-400 flex items-center justify-center transition-all flex-none"
            title="Reload List"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        {customUrlMode && (
          <div className="flex gap-2 animate-fade-in">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="gento-input flex-grow rounded-xl px-3 py-2 text-xs"
              placeholder="URL Config List"
            />
            <button
              onClick={() => onReload(customUrl)}
              className="bg-purple-600 hover:bg-purple-500 text-white px-3 rounded-xl text-xs font-bold transition-all"
            >
              Load
            </button>
          </div>
        )}

        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10">
            <Globe className="h-4 w-4" />
          </div>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full bg-slate-800/50 border border-white/5 hover:border-purple-500/30 text-slate-300 rounded-xl pl-10 pr-8 py-2.5 text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:border-purple-500/50 transition-all shadow-sm"
          >
            {availableCountries.map((c) => (
              <option key={c} value={c} className="bg-slate-900 text-slate-300 py-2">
                {c === 'All' ? 'Semua Negara' : c}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            <ChevronDown className="h-4 w-4 group-hover:text-purple-400 transition-colors" />
          </div>
        </div>
      </div>

      {/* Main List Container */}
      <div className="relative flex-grow flex flex-col overflow-hidden bg-slate-900/20">
        <div className="flex-grow overflow-y-auto p-3 space-y-2">
          {displayedProxies.map((p, idx) => {
            const key = getProxyKey(p);
            const statusInfo = proxyStatusMap[key] || { status: 'unknown', latency: 0 };
            const isSelected = selectedProxy && getProxyKey(selectedProxy) === key;

            return (
              <ProxyRow
                key={key}
                proxy={p}
                statusInfo={statusInfo}
                isSelected={!!isSelected}
                onClick={() => onSelectProxy(p)}
              />
            );
          })}

          {isLoading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="p-3 rounded-xl border flex justify-between items-center bg-white/5 border-white/5 animate-pulse"
              >
                <div className="flex items-center gap-3 overflow-hidden flex-grow min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0"></div>
                  <div className="min-w-0 flex-grow space-y-1.5">
                    <div className="h-3 bg-white/10 rounded w-24"></div>
                    <div className="h-2 bg-white/10 rounded w-32"></div>
                  </div>
                </div>
                <div className="w-12 h-5 bg-white/10 rounded"></div>
              </div>
            ))}

          {!isLoading && displayedProxies.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <Ghost className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs">Tidak ada data / Tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-white/5 bg-slate-900/40 flex-none z-20 relative lg:pb-3">
        <div className="flex justify-center items-center gap-2">
          {totalPages > 1 && (
            <>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`w-8 h-8 rounded-lg bg-slate-800 border border-white/5 text-slate-400 flex items-center justify-center ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-purple-600 hover:text-white'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-slate-500 font-mono mx-2">
                {currentPage}/{totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 rounded-lg bg-slate-800 border border-white/5 text-slate-400 flex items-center justify-center ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-purple-600 hover:text-white'
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
