import React from 'react';
import { Wifi, Loader2 } from 'lucide-react';
import { ProxyItem } from '../../types';

interface ProxyRowProps {
  proxy: ProxyItem;
  statusInfo: {
    status: 'active' | 'dead' | 'loading' | 'unknown';
    latency: number;
  };
  isSelected: boolean;
  onClick: () => void;
}

export const ProxyRow: React.FC<ProxyRowProps> = React.memo(
  ({ proxy, statusInfo, isSelected, onClick }) => {
    return (
      <div
        onClick={onClick}
        className={`p-3 rounded-xl transition-all cursor-pointer border flex justify-between items-center group active:scale-[0.98] ${
          isSelected
            ? 'bg-purple-600/10 border-purple-500/30'
            : 'bg-white/5 border-white/5 hover:bg-white/10'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden flex-grow min-w-0">
          <div
            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[9px] font-bold border flex-shrink-0 transition-colors ${
              isSelected
                ? 'bg-purple-600 text-white border-purple-400'
                : 'bg-black/30 text-slate-300 border-white/10'
            }`}
          >
            <span>{proxy.country}</span>
          </div>
          <div className="min-w-0 flex-grow">
            <span
              className={`text-xs font-bold block truncate transition ${
                isSelected ? 'text-purple-300' : 'text-slate-200 group-hover:text-purple-300'
              }`}
            >
              {proxy.provider}
            </span>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {proxy.ip}:{proxy.port}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 pl-2">
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border min-w-[50px] justify-center transition-colors ${
              statusInfo.status === 'active'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : statusInfo.status === 'dead'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : statusInfo.status === 'loading'
                    ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {statusInfo.status === 'loading' && (
              <>
                <Loader2 className="h-2 w-2 animate-spin" /> Check
              </>
            )}
            {statusInfo.status === 'active' && (
              <>
                <Wifi className="h-2 w-2" /> {statusInfo.latency} ms
              </>
            )}
            {statusInfo.status === 'dead' && <span>DEAD</span>}
            {statusInfo.status === 'unknown' && <span>WAIT</span>}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if proxy/selection or status info changes
    return (
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.proxy.ip === nextProps.proxy.ip &&
      prevProps.proxy.port === nextProps.proxy.port &&
      prevProps.statusInfo.status === nextProps.statusInfo.status &&
      prevProps.statusInfo.latency === nextProps.statusInfo.latency
    );
  }
);

ProxyRow.displayName = 'ProxyRow';
