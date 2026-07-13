import React, { useState, useEffect } from 'react';
import { X, Globe, Loader2 } from 'lucide-react';
import { ProxyIP, ApiResponse } from '../../types';
import { getErrorMessage } from '../../utils/common';

interface ProxyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProxy: ProxyIP | null;
  onSave: (data: Omit<ProxyIP, 'id'>) => Promise<void>;
  fetchGeoIP: (ip: string) => Promise<ApiResponse<Partial<ProxyIP>>>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const parseIpAndPort = (input: string): { ip: string; port?: string } => {
  const clean = input.trim();

  // Handle [IPv6]:port format (e.g. [2001:db8::1]:443)
  if (clean.startsWith('[') && clean.includes(']')) {
    const closingBracketIndex = clean.indexOf(']');
    const ip = clean.substring(1, closingBracketIndex);
    const portPart = clean.substring(closingBracketIndex + 1);
    if (portPart.startsWith(':')) {
      const port = portPart.substring(1);
      if (/^\d+$/.test(port)) {
        return { ip, port };
      }
    }
    return { ip };
  }

  // Handle standard IPv4:port or domain:port format (e.g. 1.1.1.1:443, example.com:8443)
  if (clean.includes(':')) {
    const parts = clean.split(':');
    const lastPart = parts[parts.length - 1];

    // Check if the last part is a numeric port
    if (/^\d+$/.test(lastPart)) {
      const port = lastPart;
      const ip = clean.substring(0, clean.lastIndexOf(':'));
      const colonCount = parts.length - 1;
      if (colonCount > 1) {
        // It's IPv6 without brackets. Typically no port is specified in this format.
        return { ip: clean };
      } else {
        return { ip, port };
      }
    }
  }

  return { ip: clean };
};

export const ProxyFormModal: React.FC<ProxyFormModalProps> = ({
  isOpen,
  onClose,
  editingProxy,
  onSave,
  fetchGeoIP,
  showToast,
}) => {
  const [formData, setFormData] = useState({
    proxy: '',
    port: '443',
    proxyip: true,
    ip: '',
    latency: 0,
    asn: 0,
    as_organization: '',
    colo: '',
    country: '',
    city: '',
    region: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    is_active: true,
  });

  const [isFetchingGeo, setIsFetchingGeo] = useState(false);

  useEffect(() => {
    if (editingProxy) {
      setFormData({
        proxy: editingProxy.proxy || '',
        port: editingProxy.port || '443',
        proxyip: editingProxy.proxyip,
        ip: editingProxy.ip || '',
        latency: editingProxy.latency || 0,
        asn: editingProxy.asn || 0,
        as_organization: editingProxy.as_organization || '',
        colo: editingProxy.colo || '',
        country: editingProxy.country || '',
        city: editingProxy.city || '',
        region: editingProxy.region || '',
        postal_code: editingProxy.postal_code || '',
        latitude: editingProxy.latitude || '',
        longitude: editingProxy.longitude || '',
        is_active: editingProxy.is_active,
      });
    } else {
      setFormData({
        proxy: '',
        port: '443',
        proxyip: true,
        ip: '',
        latency: 0,
        asn: 0,
        as_organization: '',
        colo: '',
        country: '',
        city: '',
        region: '',
        postal_code: '',
        latitude: '',
        longitude: '',
        is_active: true,
      });
    }
  }, [editingProxy, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleIpBlur = () => {
    if (!formData.ip) return;
    const { ip: cleanIp, port: extractedPort } = parseIpAndPort(formData.ip);
    if (extractedPort || cleanIp !== formData.ip) {
      setFormData((prev) => ({
        ...prev,
        ip: cleanIp,
        port: extractedPort || prev.port,
        proxy: prev.proxy.trim() || cleanIp,
      }));
    }
  };

  const handleFetchGeoIPDetails = async () => {
    if (!formData.ip) return;
    const trimmed = formData.ip.trim();

    setIsFetchingGeo(true);
    try {
      const { ip: cleanIp, port: extractedPort } = parseIpAndPort(trimmed);
      const response = await fetchGeoIP(cleanIp);
      if (response.success && response.data) {
        const geo = response.data;
        setFormData((prev) => ({
          ...prev,
          ip: cleanIp,
          port: extractedPort || prev.port,
          asn: geo.asn || prev.asn,
          as_organization: geo.as_organization || prev.as_organization,
          colo: geo.colo || prev.colo,
          country: geo.country || prev.country,
          city: geo.city || prev.city,
          region: geo.region || prev.region,
          postal_code: geo.postal_code || prev.postal_code,
          latitude: geo.latitude || prev.latitude,
          longitude: geo.longitude || prev.longitude,
          proxy: prev.proxy.trim() || cleanIp,
        }));
        showToast('GeoIP details loaded successfully!', 'success');
      } else {
        showToast(response.message || 'GeoIP lookup returned no data', 'error');
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsFetchingGeo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { ip: cleanIp, port: extractedPort } = parseIpAndPort(formData.ip);
      const finalProxy = formData.proxy.trim() || cleanIp;

      const payload = {
        ...formData,
        ip: cleanIp,
        port: extractedPort || formData.port,
        proxy: finalProxy,
        asn: Number(formData.asn) || null,
        latency: Number(formData.latency) || 0,
      } as Omit<ProxyIP, 'id'>;

      await onSave(payload);
      onClose();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl p-6 rounded-3xl gento-card backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">
            {editingProxy ? 'Edit Proxy Configuration' : 'Add Proxy Configuration'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                IP (Required)
              </label>
              <button
                type="button"
                onClick={handleFetchGeoIPDetails}
                disabled={isFetchingGeo || !formData.ip.trim()}
                className="text-[9px] font-bold text-purple-400 hover:text-purple-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                {isFetchingGeo ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Fetching...
                  </>
                ) : (
                  <>
                    <Globe className="h-3 w-3" /> Fetch Geo
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              name="ip"
              value={formData.ip}
              onChange={handleInputChange}
              onBlur={handleIpBlur}
              placeholder="e.g. 1.1.1.1 or 1.1.1.1:443"
              className="px-3 py-2.5 rounded-xl gento-input text-xs"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Proxy Address
            </label>
            <input
              type="text"
              name="proxy"
              value={formData.proxy}
              onChange={handleInputChange}
              placeholder="e.g. custom.proxy.com (defaults to IP)"
              className="px-3 py-2.5 rounded-xl gento-input text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Port
            </label>
            <input
              type="text"
              name="port"
              value={formData.port}
              onChange={handleInputChange}
              placeholder="e.g. 443"
              className="px-3 py-2.5 rounded-xl gento-input text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Latency (ms)
            </label>
            <input
              type="number"
              name="latency"
              value={formData.latency}
              onChange={handleInputChange}
              className="px-3 py-2.5 rounded-xl gento-input text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              ASN
            </label>
            <input
              type="number"
              name="asn"
              value={formData.asn || ''}
              onChange={handleInputChange}
              placeholder="e.g. 13335"
              className="px-3 py-2.5 rounded-xl gento-input text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              AS Organization
            </label>
            <input
              type="text"
              name="as_organization"
              value={formData.as_organization}
              onChange={handleInputChange}
              placeholder="e.g. Cloudflare, Inc."
              className="px-3 py-2.5 rounded-xl gento-input text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Colo
            </label>
            <input
              type="text"
              name="colo"
              value={formData.colo}
              onChange={handleInputChange}
              placeholder="e.g. SIN"
              className="px-3 py-2.5 rounded-xl gento-input text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Country Code
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="e.g. SG"
              className="px-3 py-2.5 rounded-xl gento-input text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="e.g. Singapore"
              className="px-3 py-2.5 rounded-xl gento-input text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Region
            </label>
            <input
              type="text"
              name="region"
              value={formData.region}
              onChange={handleInputChange}
              placeholder="e.g. Central Singapore"
              className="px-3 py-2.5 rounded-xl gento-input text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Postal Code
            </label>
            <input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
              placeholder="e.g. 189067"
              className="px-3 py-2.5 rounded-xl gento-input text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Coordinates (Lat, Long)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                placeholder="Lat"
                className="px-3 py-2.5 rounded-xl gento-input text-xs"
              />
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                placeholder="Long"
                className="px-3 py-2.5 rounded-xl gento-input text-xs"
              />
            </div>
          </div>

          <div className="md:col-span-2 flex gap-6 py-2 border-t border-white/5 mt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                name="proxyip"
                checked={formData.proxyip}
                onChange={handleInputChange}
                className="rounded border-white/10 bg-slate-950 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <span>Proxy IP Mode</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="rounded border-white/10 bg-slate-950 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <span>Status Active</span>
            </label>
          </div>

          {/* Action Footer */}
          <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-white/5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold uppercase transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold uppercase shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
