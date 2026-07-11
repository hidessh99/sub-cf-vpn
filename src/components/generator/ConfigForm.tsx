import React from 'react';
import { Undo2, Shuffle } from 'lucide-react';
import { ProxyItem } from '../../types';
import { generateUUID } from '../../utils/common';

interface ConfigFormProps {
  selectedProxy: ProxyItem | null;
  activeTab: 'vless' | 'trojan' | 'ss';
  setActiveTab: (tab: 'vless' | 'trojan' | 'ss') => void;
  formUUID: string;
  setFormUUID: (uuid: string) => void;
  formPassword: string;
  setFormPassword: (pw: string) => void;
  formSecurity: 'tls' | 'none';
  setFormSecurity: (sec: 'tls' | 'none') => void;
  formDomain: string;
  setFormDomain: (dom: string) => void;
  formBug: string;
  setFormBug: (bug: string) => void;
  formManualBug: string;
  setFormManualBug: (bug: string) => void;
  formWildcard: boolean;
  setFormWildcard: (wc: boolean) => void;
  manualAlias: string | null;
  setManualAlias: (alias: string | null) => void;
  mainDomains: string[];
  bugList: string[];
  onSubmit: (e: React.FormEvent) => void;
  defaultAlias: string;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({
  selectedProxy,
  activeTab,
  setActiveTab,
  formUUID,
  setFormUUID,
  formPassword,
  setFormPassword,
  formSecurity,
  setFormSecurity,
  formDomain,
  setFormDomain,
  formBug,
  setFormBug,
  formManualBug,
  setFormManualBug,
  formWildcard,
  setFormWildcard,
  manualAlias,
  setManualAlias,
  mainDomains,
  bugList,
  onSubmit,
  defaultAlias,
}) => {
  const finalAlias = manualAlias !== null ? manualAlias : defaultAlias;

  return (
    <div className="gento-card rounded-3xl p-6 flex flex-col flex-grow overflow-y-auto">
      {/* Configuration Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-black/20 rounded-2xl mb-6 flex-shrink-0">
        {(['vless', 'trojan', 'ss'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all uppercase ${
              activeTab === tab
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4 flex-grow flex flex-col">
        {/* Username/Alias Field */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Username / Alias</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={finalAlias}
              onChange={(e) => setManualAlias(e.target.value)}
              className="gento-input w-full rounded-xl px-4 py-3 text-xs font-bold"
              placeholder="Custom config name..."
            />
            {manualAlias !== null && (
              <button
                type="button"
                onClick={() => setManualAlias(null)}
                className="w-10 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white flex-none flex items-center justify-center transition-colors"
                title="Reset name"
              >
                <Undo2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* UUID or Password based on Active Tab */}
        {activeTab === 'vless' ? (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">UUID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formUUID}
                onChange={(e) => setFormUUID(e.target.value)}
                className="gento-input w-full rounded-xl px-4 py-3 text-xs font-mono text-purple-300"
                required
              />
              <button
                type="button"
                onClick={() => setFormUUID(generateUUID())}
                className="w-10 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors flex-none"
                title="Generate UUID"
              >
                <Shuffle className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Password</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="gento-input w-full rounded-xl px-4 py-3 text-xs font-mono text-teal-300"
                required
              />
              <button
                type="button"
                onClick={() => setFormPassword(generateUUID())}
                className="w-10 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors flex-none"
                title="Generate Password"
              >
                <Shuffle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Security & Domain Selector Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Security</label>
            <select
              value={formSecurity}
              onChange={(e) => setFormSecurity(e.target.value as 'tls' | 'none')}
              className="gento-input w-full rounded-xl px-3 py-3 text-xs cursor-pointer focus:outline-none"
            >
              <option value="tls">TLS (443)</option>
              <option value="none">None (80)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Domain</label>
            <select
              value={formDomain}
              onChange={(e) => setFormDomain(e.target.value)}
              className="gento-input w-full rounded-xl px-3 py-3 text-xs cursor-pointer focus:outline-none"
            >
              {mainDomains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bug / SNI Selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Bug</label>
          <select
            value={formBug}
            onChange={(e) => setFormBug(e.target.value)}
            className="gento-input w-full rounded-xl px-4 py-3 text-xs mb-2 cursor-pointer focus:outline-none"
          >
            <option value="">Default (No Bug)</option>
            <option value="manual">Manual Input</option>
            {bugList.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {formBug === 'manual' && (
            <input
              type="text"
              value={formManualBug}
              onChange={(e) => setFormManualBug(e.target.value)}
              placeholder="e.g. bug.com"
              className="gento-input w-full rounded-xl px-4 py-3 text-xs"
            />
          )}
          {formBug !== '' && formBug !== 'manual' && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="wildcard"
                checked={formWildcard}
                onChange={(e) => setFormWildcard(e.target.checked)}
                className="w-4 h-4 rounded bg-white/10 border-white/10 text-purple-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="wildcard" className="text-xs text-slate-400 cursor-pointer select-none">
                Wildcard (bug.domain.com)
              </label>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedProxy}
          className={`w-full mt-auto bg-gradient-to-r ${
            !selectedProxy
              ? 'from-slate-700 to-slate-800 cursor-not-allowed opacity-55 text-slate-400'
              : activeTab === 'vless'
              ? 'from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
              : activeTab === 'trojan'
              ? 'from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500'
              : 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
          } text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] mt-auto`}
        >
          {selectedProxy ? `GENERATE ${activeTab.toUpperCase()}` : 'CHOOSE A SERVER FIRST'}
        </button>
      </form>
    </div>
  );
};
