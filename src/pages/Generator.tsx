import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wifi, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { ProxyItem } from '../types';
import { CONFIG } from '../utils/config';
import { generateUUID } from '../utils/common';
import {
  generateSingleVlessLink,
  generateSingleTrojanLink,
  generateSingleSSLink,
} from '../utils/generators';
import { useToast } from '../components/Toast';
import { useProxies } from '../hooks/useProxies';
import { useProxyStatusChecker, getProxyKey } from '../hooks/useProxyStatusChecker';
import { ProxyList } from '../components/generator/ProxyList';
import { ConfigForm } from '../components/generator/ConfigForm';
import { ConfigResult } from '../components/generator/ConfigResult';

const Generator: React.FC = () => {
  // Query inputs
  const [activeProxyUrl, setActiveProxyUrl] = useState(CONFIG.proxyListUrl);
  const [customUrl, setCustomUrl] = useState(CONFIG.proxyListUrl);

  // Queries
  const { proxies, isLoadingProxies, domains, bugs } = useProxies(activeProxyUrl);

  // Status map / checks
  const { proxyStatusMap, queueChecks, clearStatusMap } = useProxyStatusChecker();

  // Component local states
  const [selectedProxy, setSelectedProxy] = useState<ProxyItem | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [activeTab, setActiveTab] = useState<'vless' | 'trojan' | 'ss'>('vless');

  // Form states
  const [formUUID, setFormUUID] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formSecurity, setFormSecurity] = useState<'tls' | 'none'>('tls');
  const [formDomain, setFormDomain] = useState('');
  const [formBug, setFormBug] = useState('');
  const [formManualBug, setFormManualBug] = useState('');
  const [formWildcard, setFormWildcard] = useState(false);
  const [manualAlias, setManualAlias] = useState<string | null>(null);

  // Results
  const [showResult, setShowResult] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [resultClash, setResultClash] = useState('');

  const { showToast } = useToast();

  // Reset/Initialize forms on mount
  useEffect(() => {
    setFormUUID(generateUUID());
    setFormPassword(generateUUID());
  }, []);

  // Set default domain when domains list is loaded
  useEffect(() => {
    if (domains.length > 0 && !formDomain) {
      setFormDomain(domains[Math.floor(Math.random() * domains.length)]);
    }
  }, [domains, formDomain]);

  // Reset custom alias on proxy selection change
  useEffect(() => {
    setManualAlias(null);
  }, [selectedProxy]);

  // Handle Custom URL load
  const handleReload = (url: string) => {
    clearStatusMap();
    setActiveProxyUrl(url);
  };

  const handleSelectProxy = (p: ProxyItem) => {
    setSelectedProxy(p);
    setMobileView('detail');
    setShowResult(false);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProxy) return;

    const path = CONFIG.pathTemplate
      .replace('{ip}', selectedProxy.ip)
      .replace('{port}', selectedProxy.port);

    const defaultAlias = `${selectedProxy.country} - ${selectedProxy.provider} [${activeTab.toUpperCase()}-${
      formSecurity === 'tls' ? 'TLS' : 'NTLS'
    }]`;
    const serverName = manualAlias !== null ? manualAlias : defaultAlias;
    const encodedName = encodeURIComponent(serverName);
    const encodedPath = encodeURIComponent(path);

    let svr = formBug || formDomain;
    if (formBug === 'manual') svr = formManualBug;

    const isManual = formBug === 'manual';
    const effectiveBug = isManual ? formManualBug : formBug;

    let host = formDomain;
    let sni = formDomain;

    if (effectiveBug) {
      if (formWildcard && effectiveBug !== 'manual') {
        host = `${effectiveBug}.${formDomain}`;
        sni = host;
      } else {
        host = effectiveBug;
        sni = effectiveBug;
      }
    }

    const port = formSecurity === 'tls' ? 443 : 80;

    let result = { url: '', clash: '' };

    if (activeTab === 'vless') {
      result = generateSingleVlessLink(
        formUUID,
        svr || formDomain,
        port,
        formSecurity,
        host,
        encodedPath,
        sni,
        encodedName
      );
    } else if (activeTab === 'trojan') {
      result = generateSingleTrojanLink(
        formPassword,
        svr || formDomain,
        port,
        formSecurity,
        host,
        encodedPath,
        sni,
        encodedName
      );
    } else if (activeTab === 'ss') {
      result = generateSingleSSLink(
        formPassword,
        svr || formDomain,
        port,
        formSecurity,
        host,
        encodedPath,
        sni,
        encodedName
      );
    }

    setResultUrl(result.url);
    setResultClash(result.clash);
    setShowResult(true);
  };

  const handleCreateNew = () => {
    setFormUUID(generateUUID());
    setFormPassword(generateUUID());
    setShowResult(false);
  };

  // Helper variables for rendering details
  const selectedProxyKey = selectedProxy ? getProxyKey(selectedProxy) : '';
  const currentStatus = selectedProxy
    ? proxyStatusMap[selectedProxyKey] || { status: 'unknown', latency: 0 }
    : { status: 'unknown', latency: 0 };

  const defaultAlias = selectedProxy
    ? `${selectedProxy.country} - ${selectedProxy.provider} [${activeTab.toUpperCase()}-${
        formSecurity === 'tls' ? 'TLS' : 'NTLS'
      }]`
    : '';

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full h-full flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-full lg:min-h-0">
        {/* Left Side: Proxies List */}
        <div
          className={`lg:col-span-5 flex flex-col lg:h-full lg:min-h-0 transition-all duration-300 ${
            mobileView === 'detail' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <ProxyList
            proxies={proxies}
            isLoading={isLoadingProxies}
            proxyStatusMap={proxyStatusMap}
            selectedProxy={selectedProxy}
            onSelectProxy={handleSelectProxy}
            customUrl={customUrl}
            setCustomUrl={setCustomUrl}
            onReload={handleReload}
            queueChecks={queueChecks}
          />
        </div>

        {/* Right Side: Selected Details & Configuration Forms */}
        <div
          className={`lg:col-span-7 flex flex-col lg:h-full lg:min-h-0 animate-fade-in-up transition-all duration-300 ${
            mobileView === 'list' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Header Card for Selected Proxy */}
          <div className="gento-card rounded-3xl p-5 mb-4 relative overflow-hidden flex-shrink-0">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                  Selected Server
                </h3>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-white truncate max-w-[200px]">
                    {selectedProxy ? selectedProxy.provider : 'Select Proxy'}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white/10 rounded text-white">
                    {selectedProxy ? selectedProxy.country : '-'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileView('list')}
                className="lg:hidden w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700 border border-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 relative z-10">
              <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                <div className="text-[10px] text-slate-500 mb-1">IP Address</div>
                <div className="font-mono text-xs text-teal-400 font-bold">
                  {selectedProxy ? selectedProxy.ip : '-'}
                </div>
              </div>
              <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                <div className="text-[10px] text-slate-500 mb-1">Live Status</div>
                <div>
                  {currentStatus.status === 'loading' && (
                    <span className="text-xs text-yellow-500 font-bold flex items-center gap-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking
                    </span>
                  )}
                  {currentStatus.status === 'active' && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Wifi className="h-3.5 w-3.5" /> Active ({currentStatus.latency} ms)
                    </span>
                  )}
                  {currentStatus.status === 'dead' && (
                    <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Dead
                    </span>
                  )}
                  {currentStatus.status === 'unknown' && (
                    <span className="text-xs text-slate-500 font-bold">Waiting Check...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form or Result View */}
          {!showResult ? (
            <ConfigForm
              selectedProxy={selectedProxy}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              formUUID={formUUID}
              setFormUUID={setFormUUID}
              formPassword={formPassword}
              setFormPassword={setFormPassword}
              formSecurity={formSecurity}
              setFormSecurity={setFormSecurity}
              formDomain={formDomain}
              setFormDomain={setFormDomain}
              formBug={formBug}
              setFormBug={setFormBug}
              formManualBug={formManualBug}
              setFormManualBug={setFormManualBug}
              formWildcard={formWildcard}
              setFormWildcard={setFormWildcard}
              manualAlias={manualAlias}
              setManualAlias={setManualAlias}
              mainDomains={domains}
              bugList={bugs}
              onSubmit={handleGenerate}
              defaultAlias={defaultAlias}
            />
          ) : (
            <ConfigResult
              resultUrl={resultUrl}
              resultClash={resultClash}
              onBack={() => setShowResult(false)}
              onNew={handleCreateNew}
              providerName={selectedProxy?.provider || 'config'}
              showToast={showToast}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Generator;
