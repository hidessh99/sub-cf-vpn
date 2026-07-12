import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../utils/adminApi';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useToast } from '../../components/Toast';

interface Stats {
  proxies: number;
  domains: number;
  bugs: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ proxies: 0, domains: 0, bugs: 0 });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminFetch('/api/v1/dashboard/stats');
        if (response.success) {
          setStats(response.data);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to fetch dashboard statistics', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [showToast]);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-400 text-sm mt-1">Manage and monitor your Cloudflare VPN configuration data</p>
        </div>

        {loading ? (
          <div className="flex-grow flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Proxies Card */}
            <div className="p-6 rounded-3xl gento-card backdrop-blur-xl border border-white/5 relative overflow-hidden group hover:border-purple-500/20 transition-all duration-300">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500 text-purple-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-40 h-40">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.875c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25M18.75 21V9.75m0 0l-3-3m3 3l3-3m-9 9.75V9.75m0 0l-3-3m3 3l3-3M6.75 21V9.75m0 0l-3-3m3 3l3-3M12 9.75V3.75m0 0L9 6.75M12 3.75l3 3" />
                </svg>
              </div>
              <div className="flex flex-col gap-4">
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.875c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25M18.75 21V9.75m0 0l-3-3m3 3l3-3m-9 9.75V9.75m0 0l-3-3m3 3l3-3M6.75 21V9.75m0 0l-3-3m3 3l3-3M12 9.75V3.75m0 0L9 6.75M12 3.75l3 3" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-400">Total Proxy IPs</span>
                  <h3 className="text-3xl font-bold text-white mt-1">{stats.proxies}</h3>
                </div>
              </div>
            </div>

            {/* Domains Card */}
            <div className="p-6 rounded-3xl gento-card backdrop-blur-xl border border-white/5 relative overflow-hidden group hover:border-pink-500/20 transition-all duration-300">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500 text-pink-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-40 h-40">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 0a9.015 9.015 0 018.716 6.747M12 3a9.015 9.015 0 00-8.716 6.747M3.75 12h16.5" />
                </svg>
              </div>
              <div className="flex flex-col gap-4">
                <div className="h-12 w-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 0a9.015 9.015 0 018.716 6.747M12 3a9.015 9.015 0 00-8.716 6.747M3.75 12h16.5" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-400">Total Domains</span>
                  <h3 className="text-3xl font-bold text-white mt-1">{stats.domains}</h3>
                </div>
              </div>
            </div>

            {/* Bugs Card */}
            <div className="p-6 rounded-3xl gento-card backdrop-blur-xl border border-white/5 relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-300">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500 text-cyan-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-40 h-40">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 15.752zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="flex flex-col gap-4">
                <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 15.752zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-400">Total Hostname Bugs</span>
                  <h3 className="text-3xl font-bold text-white mt-1">{stats.bugs}</h3>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
