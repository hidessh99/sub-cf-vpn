import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { ApiResponse, LoginResponseData } from '../../types/admin';
import { Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json() as ApiResponse<LoginResponseData>;
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('admin_token', data.data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.data.admin));
      
      showToast('Welcome back, Admin!', 'success');
      navigate('/admin/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Invalid username or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] w-full bg-[#020617] relative px-4 overflow-hidden">
      <div className="ambient-light"></div>
      
      <div className="w-full max-w-md p-8 rounded-3xl gento-card backdrop-blur-xl border border-white/5 shadow-2xl relative z-10 flex flex-col items-center">
        {/* Logo Icon */}
        <div className="h-16 px-4 py-2 rounded-2xl bg-slate-900/90 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center justify-center mb-6">
          <img src="https://cdn.jsdelivr.net/gh/kumpulanremaja/cdn/kontmu.svg" alt="logo" className="h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] animate-pulse" />
        </div>

        <h2 className="text-2xl font-bold text-center text-white mb-2">Welcome Back</h2>
        <p className="text-slate-400 text-sm text-center mb-8">Access the VPN Configuration Dashboard</p>

        <form onSubmit={handleLogin} className="w-full space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 pl-1">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl gento-input text-sm"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 pl-1">Password</label>
            <div className="relative w-full">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-2xl gento-input text-sm"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors duration-200"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-500/20 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Logging in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
