import React, { useEffect, useState } from 'react';
import { apiClient } from '../../utils/apiClient';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { getErrorMessage } from '../../utils/common';

interface Bug {
  id: number;
  hostname: string;
  is_active: boolean;
  created_at: string;
}

export const BugManagement: React.FC = () => {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [newBug, setNewBug] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [showConfirm, setShowConfirm] = useState(false);
  const [bugToDelete, setBugToDelete] = useState<number | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');

  const filteredBugs = bugs.filter((b) =>
    b.hostname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchBugs = async () => {
    setLoading(true);
    try {
      const response = await apiClient('/api/v1/bugs');
      if (response.success) {
        setBugs(response.data);
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
  }, []);

  const handleAddBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBug.trim()) return;

    setSubmitting(true);
    try {
      const response = await apiClient('/api/v1/bugs', {
        method: 'POST',
        body: JSON.stringify({ hostname: newBug.trim() }),
      });

      if (response.success) {
        showToast('Bug hostname added successfully', 'success');
        setNewBug('');
        fetchBugs();
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const initiateDelete = (id: number) => {
    setBugToDelete(id);
    setShowConfirm(true);
  };

  const handleDeleteBug = async () => {
    if (bugToDelete === null) return;

    try {
      const response = await apiClient(`/api/v1/bugs/${bugToDelete}`, {
        method: 'DELETE',
      });

      if (response.success) {
        showToast('Bug hostname deleted successfully', 'success');
        fetchBugs();
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setShowConfirm(false);
      setBugToDelete(null);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJson);
      const response = await apiClient('/api/v1/bugs/import', {
        method: 'POST',
        body: JSON.stringify(parsed),
      });
      if (response.success) {
        showToast(response.message || 'Bug hostnames imported successfully', 'success');
        setShowImportModal(false);
        setImportJson('');
        fetchBugs();
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 w-full max-w-4xl">
        <div className="flex justify-between items-center w-full">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Bug Hostname Management
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Manage SNI / Bug hostnames that are allowed in configurations
            </p>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold tracking-wider uppercase transition-all duration-200"
          >
            Import JSON
          </button>
        </div>

        {/* Add Bug Form */}
        <div className="p-6 rounded-3xl gento-card backdrop-blur-xl border border-white/5 shadow-2xl">
          <h3 className="text-sm font-semibold text-white mb-4">Add New SNI / Bug Hostname</h3>
          <form onSubmit={handleAddBug} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow flex flex-col gap-1">
              <input
                type="text"
                placeholder="e.g. sni.domain.com"
                value={newBug}
                onChange={(e) => setNewBug(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl gento-input text-xs"
                required
                disabled={submitting}
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !newBug.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold uppercase shadow-lg shadow-purple-500/20 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {submitting ? 'Adding...' : 'Add Hostname'}
            </button>
          </form>
        </div>

        {/* Bug List Table */}
        <div className="rounded-3xl gento-card backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
          {/* Search Toolbar */}
          {!loading && bugs.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-white/5 bg-slate-950/40">
              <div className="relative flex-grow max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by hostname..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl gento-input text-xs"
                />
              </div>
              <div className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                Showing {filteredBugs.length} of {bugs.length} hosts
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <svg className="animate-spin h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : bugs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10 text-slate-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 15.752zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <span className="text-xs font-semibold">No bug hostnames registered</span>
            </div>
          ) : filteredBugs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10 text-slate-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z"
                />
              </svg>
              <span className="text-xs font-semibold">No matching bug hostnames found</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-900/30">
                  <th className="px-6 py-3.5">SNI / Bug Hostname</th>
                  <th className="px-6 py-3.5">Date Added</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 text-xs">
                {filteredBugs.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.01]">
                    <td className="px-6 py-4 font-mono font-medium text-white">{b.hostname}</td>
                    <td className="px-6 py-4 text-slate-400">{b.created_at}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => initiateDelete(b.id)}
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
        title="Delete Bug Hostname?"
        message="Are you sure you want to delete this bug hostname? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteBug}
        onCancel={() => {
          setShowConfirm(false);
          setBugToDelete(null);
        }}
      />

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl gento-card backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">Import Bug Hostnames JSON</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleImport} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  JSON Data (Array of strings)
                </label>
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
