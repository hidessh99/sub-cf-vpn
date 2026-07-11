import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ProxyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (jsonText: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ProxyImportModal: React.FC<ProxyImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  showToast,
}) => {
  const [importJson, setImportJson] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setImportJson('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Client-side schema validation
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of proxy objects.');
      }
      
      await onImport(importJson);
      showToast('Proxies imported successfully!', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to import proxies. Make sure it is valid JSON.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl p-6 rounded-3xl gento-card backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">Import Proxies JSON</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Paste JSON Array
            </label>
            <textarea
              rows={12}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder={`[\n  {\n    "proxy": "1.1.1.1",\n    "port": "443",\n    "ip": "1.1.1.1",\n    "country": "SG"\n  }\n]`}
              className="w-full p-4 rounded-2xl gento-input text-xs font-mono"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold uppercase transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold uppercase shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Importing...' : 'Start Import'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
