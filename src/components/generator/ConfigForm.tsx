import React, { useState, useRef, useEffect } from 'react';
import { Undo2, Shuffle, Search, ChevronDown, Check } from 'lucide-react';
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

  const [isBugDropdownOpen, setIsBugDropdownOpen] = useState(false);
  const [bugSearch, setBugSearch] = useState('');
  const bugDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bugDropdownRef.current &&
        !bugDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBugDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
            <label htmlFor="security-select" className="text-[10px] font-bold text-slate-500 uppercase ml-1">Security</label>
            <select
              id="security-select"
              value={formSecurity}
              onChange={(e) => setFormSecurity(e.target.value as 'tls' | 'none')}
              className="gento-input w-full rounded-xl px-3 py-3 text-xs cursor-pointer focus:outline-none"
            >
              <option value="tls">TLS (443)</option>
              <option value="none">None (80)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="domain-select" className="text-[10px] font-bold text-slate-500 uppercase ml-1">Domain</label>
            <select
              id="domain-select"
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
          <div className="relative w-full mb-2" ref={bugDropdownRef}>
            <button
              type="button"
              onClick={() => setIsBugDropdownOpen(!isBugDropdownOpen)}
              className="gento-input w-full rounded-xl px-4 py-3 text-xs text-left cursor-pointer flex justify-between items-center focus:outline-none"
            >
              <span className="truncate">
                {formBug === ""
                  ? "Default (No Bug)"
                  : formBug === "manual"
                  ? `Manual: ${formManualBug || "(Not entered)"}`
                  : formBug}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                  isBugDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isBugDropdownOpen && (
              <div className="absolute z-[99] bottom-full left-0 w-full mb-1 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl p-1 flex flex-col backdrop-blur-md animate-fade-in">
                {/* Search Input Box */}
                <div className="flex items-center gap-2 p-2 border-b border-white/5 flex-shrink-0">
                  <Search className="h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={bugSearch}
                    onChange={(e) => setBugSearch(e.target.value)}
                    placeholder="Cari bug..."
                    className="bg-transparent border-none text-slate-200 text-xs w-full focus:outline-none focus:ring-0 p-0"
                  />
                  {bugSearch && (
                    <button
                      type="button"
                      onClick={() => setBugSearch("")}
                      className="text-[10px] text-slate-500 hover:text-white px-1"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Options list */}
                <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 scrollbar-thin">
                  {/* Default Option */}
                  {("Default (No Bug)".toLowerCase().includes(bugSearch.toLowerCase()) ||
                    !bugSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormBug("");
                        setIsBugDropdownOpen(false);
                        setBugSearch("");
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-left text-xs flex justify-between items-center hover:bg-white/5 transition-colors ${
                        formBug === ""
                          ? "text-purple-400 bg-purple-500/5 font-semibold"
                          : "text-slate-300"
                      }`}
                    >
                      <span>Default (No Bug)</span>
                      {formBug === "" && <Check className="h-3.5 w-3.5 text-purple-400" />}
                    </button>
                  )}

                  {/* Manual Option */}
                  {("Input Manual / Custom".toLowerCase().includes(bugSearch.toLowerCase()) ||
                    !bugSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormBug("manual");
                        setIsBugDropdownOpen(false);
                        setBugSearch("");
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-left text-xs flex justify-between items-center hover:bg-white/5 transition-colors ${
                        formBug === "manual"
                          ? "text-purple-400 bg-purple-500/5 font-semibold"
                          : "text-slate-300"
                      }`}
                    >
                      <span>Input Manual / Custom</span>
                      {formBug === "manual" && <Check className="h-3.5 w-3.5 text-purple-400" />}
                    </button>
                  )}

                  {/* Filtered Bug List */}
                  {bugList
                    .filter((b) => b.toLowerCase().includes(bugSearch.toLowerCase()))
                    .map((b) => {
                      const isSelected = formBug === b;
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => {
                            setFormBug(b);
                            setIsBugDropdownOpen(false);
                            setBugSearch("");
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-left text-xs flex justify-between items-center hover:bg-white/5 transition-colors truncate ${
                            isSelected
                              ? "text-purple-400 bg-purple-500/5 font-semibold"
                              : "text-slate-300"
                          }`}
                        >
                          <span className="truncate">{b}</span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}

                  {/* No options found */}
                  {bugList.filter((b) => b.toLowerCase().includes(bugSearch.toLowerCase()))
                    .length === 0 &&
                    !("Default (No Bug)".toLowerCase().includes(bugSearch.toLowerCase())) &&
                    !("Input Manual / Custom".toLowerCase().includes(bugSearch.toLowerCase())) && (
                      <div className="py-6 text-center text-xs text-slate-500">
                        Tidak ditemukan. Pilih 'Input Manual' untuk custom bug.
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
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
