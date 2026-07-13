import React, { useState } from 'react';
import {
  Search,
  Loader2,
  Plus,
  Download,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { useAdminProxies } from '../../hooks/useAdminProxies';
import { ProxyIP } from '../../types';
import { ProxyFormModal } from '../../components/admin/ProxyFormModal';
import { ProxyImportModal } from '../../components/admin/ProxyImportModal';
import { getErrorMessage } from '../../utils/common';

export const ProxyManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  const { showToast } = useToast();

  // Queries & Mutations from custom hook
  const {
    proxies,
    total,
    isLoading,
    isFetching,
    addProxy,
    editProxy,
    deleteProxy,
    importProxies,
    syncHealth,
    fetchGeoIP,
  } = useAdminProxies(page, limit, search);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProxy, setEditingProxy] = useState<ProxyIP | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [proxyToDelete, setProxyToDelete] = useState<number | null>(null);

  // Clean Dead Proxies Trigger
  const handleSyncHealth = async () => {
    try {
      const res = await syncHealth.mutateAsync();
      showToast(res.message || 'Proxy health check started in the background', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleOpenAdd = () => {
    setEditingProxy(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (proxy: ProxyIP) => {
    setEditingProxy(proxy);
    setShowAddModal(true);
  };

  const initiateDelete = (id: number) => {
    setProxyToDelete(id);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (proxyToDelete === null) return;
    try {
      const res = await deleteProxy.mutateAsync(proxyToDelete);
      showToast(res.message || 'Proxy deleted successfully', 'success');
      // If deleted the last item on the page, roll back page index
      if (proxies.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setShowConfirm(false);
      setProxyToDelete(null);
    }
  };

  const handleSaveProxy = async (proxyData: Omit<ProxyIP, 'id'>) => {
    if (editingProxy) {
      const res = await editProxy.mutateAsync({ id: editingProxy.id, data: proxyData });
      showToast(res.message || 'Proxy updated successfully', 'success');
    } else {
      const res = await addProxy.mutateAsync(proxyData);
      showToast(res.message || 'Proxy added successfully', 'success');
    }
  };

  const handleImportJson = async (jsonText: string) => {
    await importProxies.mutateAsync(jsonText);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 w-full h-full">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Proxy IP Management</h2>
            <p className="text-slate-400 text-sm mt-1">Total {total} configurations registered</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <button
              onClick={handleSyncHealth}
              disabled={syncHealth.isPending}
              className="flex-grow sm:flex-initial px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:text-white hover:bg-red-600 hover:border-red-600 disabled:opacity-50 disabled:pointer-events-none text-xs font-semibold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              {syncHealth.isPending ? (
                <>
                  <Loader2 className="animate-spin h-3.5 w-3.5 text-current" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Clean Dead Proxies
                </>
              )}
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex-grow sm:flex-initial px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Import JSON
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold tracking-wider uppercase shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-pink-500 transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Proxy
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="w-full flex gap-3 p-3 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md flex-shrink-0">
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
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-grow w-full overflow-hidden rounded-3xl gento-card backdrop-blur-xl border border-white/5 shadow-2xl flex flex-col justify-between min-h-[400px]">
          <div className="overflow-x-auto min-h-0 flex-grow">
            {isLoading || isFetching ? (
              <div className="flex justify-center items-center py-32">
                <Loader2 className="animate-spin h-8 w-8 text-purple-500" />
              </div>
            ) : proxies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-slate-500 gap-2">
                <AlertTriangle className="w-12 h-12 text-slate-600" />
                <span className="text-sm font-semibold">No proxies found</span>
                <span className="text-xs">
                  Add a new proxy configuration or import a JSON list.
                </span>
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
                      <td className="px-6 py-4 truncate max-w-[200px]">
                        {p.as_organization || 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-mono text-purple-400">{p.colo || 'N/A'}</td>
                      <td className="px-6 py-4 font-mono">{p.latency}ms</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                            p.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              p.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                            }`}
                          />
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-2.5 py-1 rounded-lg border border-white/10 hover:border-white/20 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => initiateDelete(p.id)}
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
            <div className="flex justify-between items-center px-6 py-4 border-t border-white/5 bg-slate-900/20 flex-shrink-0">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3.5 py-1.5 rounded-lg border border-white/10 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none text-xs transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3.5 py-1.5 rounded-lg border border-white/10 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none text-xs transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <ProxyFormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          editingProxy={editingProxy}
          onSave={handleSaveProxy}
          fetchGeoIP={fetchGeoIP}
          showToast={showToast}
        />

        {/* Import Modal */}
        <ProxyImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportJson}
          showToast={showToast}
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={showConfirm}
          title="Delete Proxy Configuration?"
          message="Are you sure you want to delete this proxy? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowConfirm(false);
            setProxyToDelete(null);
          }}
        />
      </div>
    </AdminLayout>
  );
};
