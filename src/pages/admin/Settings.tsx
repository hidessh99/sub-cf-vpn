import React, { useState } from 'react';
import { apiClient } from '../../utils/apiClient';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useToast } from '../../components/Toast';
import { getErrorMessage } from '../../utils/common';

export const Settings: React.FC = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('All fields are required', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient('/api/v1/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (response.success) {
        showToast('Password changed successfully', 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 w-full max-w-xl">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Account Settings</h2>
          <p className="text-slate-400 text-sm mt-1">Configure your administrator account credentials</p>
        </div>

        <div className="p-6 rounded-3xl gento-card backdrop-blur-xl border border-white/5 shadow-2xl">
          <h3 className="text-sm font-semibold text-white mb-6">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl gento-input text-xs"
                required
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">New Password</label>
              <input
                type="password"
                placeholder="Enter new password (min. 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl gento-input text-xs"
                required
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl gento-input text-xs"
                required
                disabled={submitting}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold uppercase shadow-lg shadow-purple-500/20 transition-all duration-200 disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};
