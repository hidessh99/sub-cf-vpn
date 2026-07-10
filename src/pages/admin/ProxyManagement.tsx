import React, { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '../../utils/adminApi';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useToast } from '../../components/Toast';
import { PaginatedResponse } from '../../types/admin';

interface ProxyIP {
  id: number;
  proxy: string;
  port: string;
  proxyip: boolean;
  ip: string;
  latency: number;
  asn: number | null;
  as_organization: string | null;
  colo: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  latitude: string | null;
  longitude: string | null;
  is_active: boolean;
}

export const ProxyManagement: React.FC = () => {
  const [proxies, setProxies] = useState<ProxyIP[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProxy, setEditingProxy] = useState<ProxyIP | null>(null);

  // Form inputs
  const [formData, setFormData] = useState({
    proxy: '',
    port: '443',
    proxyip: true,
    ip: '',
    latency: 0,
    asn: '',
    as_organization: '',
    colo: '',
    country: '',
    city: '',
    region: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    is_active: true
  });
  
  const [importJson, setImportJson] = useState('');

  const fetchProxies = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      if (search.trim()) {
        query.append('search', search.trim());
      }

      const response = await adminFetch<PaginatedResponse<ProxyIP>>(`/api/v1/proxies?${query.toString()}`);
      if (response.success) {
        setProxies(response.data);
        setTotal(response.pagination.total);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch proxies', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, showToast]);

  useEffect(() => {
    fetchProxies();
  }, [fetchProxies]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleOpenAdd = () => {
    setFormData({
      proxy: '',
      port: '443',
      proxyip: true,
      ip: '',
      latency: 0,
      asn: '',
      as_organization: '',
      colo: '',
      country: '',
      city: '',
      region: '',
      postal_code: '',
      latitude: '',
      longitude: '',
      is_active: true
    });
    setEditingProxy(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: ProxyIP) => {
    setEditingProxy(p);
    setFormData({
      proxy: p.proxy,
      port: p.port,
      proxyip: p.proxyip,
      ip: p.ip,
      latency: p.latency,
      asn: p.asn ? String(p.asn) : '',
      as_organization: p.as_organization || '',
      colo: p.colo || '',
      country: p.country || '',
      city: p.city || '',
      region: p.region || '',
      postal_code: p.postal_code || '',
      latitude: p.latitude || '',
      longitude: p.longitude || '',
      is_active: p.is_active
    });
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ip) {
      showToast('IP is required', 'error');
      return;
    }

    const payload = {
      ...formData,
      latency: Number(formData.latency),
      asn: formData.asn ? Number(formData.asn) : null
    };

    try {
      if (editingProxy) {
        const response = await adminFetch(`/api/v1/proxies/${editingProxy.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (response.success) {
          showToast('Proxy updated successfully', 'success');
        }
      } else {
        const response = await adminFetch('/api/v1/proxies', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (response.success) {
          showToast('Proxy added successfully', 'success');
        }
      }
      setShowAddModal(false);
      fetchProxies();
    } catch (err: any) {
      showToast(err.message || 'Failed to save proxy', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this proxy?')) return;
    try {
      const response = await adminFetch(`/api/v1/proxies/${id}`, {
        method: 'DELETE'
      });
      if (response.success) {
        showToast('Proxy deleted successfully', 'success');
        fetchProxies();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete proxy', 'error');
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJson);
      const response = await adminFetch('/api/v1/proxies/import', {
        method: 'POST',
        body: JSON.stringify(parsed)
      });
      if (response.success) {
        showToast(response.message || 'Proxies imported successfully', 'success');
        setShowImportModal(false);
        setImportJson('');
        fetchProxies();
      }
    } catch (err: any) {
      showToast(err.message || 'Invalid JSON format or import failed', 'error');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 w-full h-full">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Proxy IP Management</h2>
            <p className="text-slate-400 text-sm mt-1">Total {total} configurations registered</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold tracking-wider uppercase transition-all duration-200"
            >
              Import JSON
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold tracking-wider uppercase shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-pink-500 transition-all duration-200"
            >
              Add Proxy
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="w-full flex gap-3 p-3 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by IP, Host, Country, Organization, Colo..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset page on filter
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl gento-input text-xs"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602z" />
            </svg>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-grow w-full overflow-hidden rounded-3xl gento-card backdrop-blur-xl border border-white/5 shadow-2xl flex flex-col justify-between">
          <div className="overflow-x-auto min-h-0">
            {loading ? (
              <div className="flex justify-center items-center py-32">
                <svg className="animate-spin h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : proxies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-slate-500 gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <span className="text-sm font-semibold">No proxies found</span>
                <span className="text-xs">Add a new proxy configuration or import a JSON list.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/30">
                    <th className="px-6 py-4">IP/Proxy</th>
                    <th className="px-6 py-4">Port</th>
                    <th className="px-6 py-4">Country</th>
                    <th className="px-6 py-4">ISP / Org</th>
                    <th className="px-6 py-4">Colo</th>
                    <th className="px-6 py-4">Latency</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 text-xs">
                  {proxies.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors duration-150">
                      <td className="px-6 py-4 font-mono font-medium text-white">{p.proxy}</td>
                      <td className="px-6 py-4 font-mono">{p.port}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg font-bold">
                          {p.country || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 truncate max-w-xs">{p.as_organization || 'N/A'}</td>
                      <td className="px-6 py-4 font-mono text-purple-400">{p.colo || 'N/A'}</td>
                      <td className="px-6 py-4 font-mono">{p.latency}ms</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                          p.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${p.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-2.5 py-1 rounded-lg border border-white/10 hover:border-white/20 hover:bg-slate-800 text-slate-300 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-150"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-white/5 bg-slate-900/20">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3.5 py-1.5 rounded-lg border border-white/10 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none text-xs"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3.5 py-1.5 rounded-lg border border-white/10 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl p-6 rounded-3xl gento-card backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">
                  {editingProxy ? 'Edit Proxy Configuration' : 'Add Proxy Configuration'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">IP (Required)</label>
                  <input
                    type="text"
                    name="ip"
                    value={formData.ip}
                    onChange={handleInputChange}
                    placeholder="e.g. 1.1.1.1"
                    className="px-3 py-2.5 rounded-xl gento-input text-xs"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Proxy Address</label>
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
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Port</label>
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
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Latency (ms)</label>
                  <input
                    type="number"
                    name="latency"
                    value={formData.latency}
                    onChange={handleInputChange}
                    className="px-3 py-2.5 rounded-xl gento-input text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">ASN</label>
                  <input
                    type="number"
                    name="asn"
                    value={formData.asn}
                    onChange={handleInputChange}
                    placeholder="e.g. 13335"
                    className="px-3 py-2.5 rounded-xl gento-input text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">AS Organization</label>
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
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Colo</label>
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
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Country Code</label>
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
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">City</label>
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
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Region</label>
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
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Postal Code</label>
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
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Coordinates (Lat, Long)</label>
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
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="proxyip"
                      checked={formData.proxyip}
                      onChange={handleInputChange}
                      className="rounded border-white/10 bg-slate-950 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Proxy IP Mode</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="rounded border-white/10 bg-slate-950 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Status Active</span>
                  </label>
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-white/5 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold uppercase shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-pink-500"
                  >
                    Save Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xl p-6 rounded-3xl gento-card backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col gap-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">Import Proxies JSON</h3>
                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleImport} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Paste JSON Array</label>
                  <textarea
                    rows={12}
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                    placeholder='[\n  {\n    "proxy": "1.1.1.1",\n    "port": "443",\n    "ip": "1.1.1.1",\n    "country": "SG"\n  }\n]'
                    className="w-full p-4 rounded-2xl gento-input text-xs font-mono"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold uppercase shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-pink-500"
                  >
                    Start Import
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
