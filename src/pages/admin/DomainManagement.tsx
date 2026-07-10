import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../utils/adminApi';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

interface Domain {
  id: number;
  domain: string;
  is_active: boolean;
  created_at: string;
}

export const DomainManagement: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [showConfirm, setShowConfirm] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const response = await adminFetch('/api/v1/domains');
      if (response.success) {
        setDomains(response.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch domains', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    setSubmitting(true);
    try {
      const response = await adminFetch('/api/v1/domains', {
        method: 'POST',
        body: JSON.stringify({ domain: newDomain.trim() }),
      });

      if (response.success) {
        showToast('Domain added successfully', 'success');
        setNewDomain('');
        fetchDomains();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add domain', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const initiateDelete = (id: number) => {
    setDomainToDelete(id);
    setShowConfirm(true);
  };

  const handleDeleteDomain = async () => {
    if (domainToDelete === null) return;

    try {
      const response = await adminFetch(`/api/v1/domains/${domainToDelete}`, {
        method: 'DELETE',
      });

      if (response.success) {
        showToast('Domain deleted successfully', 'success');
        fetchDomains();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete domain', 'error');
    } finally {
      setShowConfirm(false);
      setDomainToDelete(null);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJson);
      const response = await adminFetch('/api/v1/domains/import', {
        method: 'POST',
        body: JSON.stringify(parsed)
      });
      if (response.success) {
        showToast(response.message || 'Domains imported successfully', 'success');
        setShowImportModal(false);
        setImportJson('');
        fetchDomains();
      }
    } catch (err: any) {
      showToast(err.message || 'Invalid JSON format or import failed', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 w-full max-w-4xl">
        <div className="flex justify-between items-center w-full">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Domain Management</h2>
            <p className="text-slate-400 text-sm mt-1">Manage domains that are allowed in configurations</p>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold tracking-wider uppercase transition-all duration-200"
          >
            Import JSON
          </button>
        </div>

        {/* Add Domain Form */}
        <div className="p-6 rounded-3xl gento-card backdrop-blur-xl border border-white/5 shadow-2xl">
          <h3 className="text-sm font-semibold text-white mb-4">Add New Domain</h3>
          <form onSubmit={handleAddDomain} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow flex flex-col gap-1">
              <input
                type="text"
                placeholder="e.g. example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl gento-input text-xs"
                required
                disabled={submitting}
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !newDomain.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold uppercase shadow-lg shadow-purple-500/20 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {submitting ? 'Adding...' : 'Add Domain'}
            </button>
          </form>
        </div>

        {/* Domain List Table */}
        <div className="rounded-3xl gento-card backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <svg className="animate-spin h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : domains.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 0a9.015 9.015 0 018.716 6.747M12 3a9.015 9.015 0 00-8.716 6.747M3.75 12h16.5" />
              </svg>
              <span className="text-xs font-semibold">No domains registered</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/30">
                  <th className="px-6 py-3.5">Domain</th>
                  <th className="px-6 py-3.5">Date Added</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 text-xs">
                {domains.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.01]">
                    <td className="px-6 py-4 font-mono font-medium text-white">{d.domain}</td>
                    <td className="px-6 py-4 text-slate-400">{d.created_at}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => initiateDelete(d.id)}
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
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Domain?"
        message="Are you sure you want to delete this domain? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteDomain}
        onCancel={() => {
          setShowConfirm(false);
          setDomainToDelete(null);
        }}
      />

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl gento-card backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">Import Domains JSON</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleImport} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">JSON Data (Array of strings)</label>
                <textarea
                  rows={8}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='[\n  "example.com",\n  "test.com"\n]'
                  className="w-full p-3 rounded-xl gento-input font-mono text-xs focus:ring-1 focus:ring-purple-500"
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
    </AdminLayout>
  );
};
