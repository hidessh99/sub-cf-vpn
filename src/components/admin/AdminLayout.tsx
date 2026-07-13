import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/AuthService';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const adminUser = AuthService.getUser() || { username: 'Admin' };

  const handleLogout = () => {
    AuthService.clearSession();
    navigate('/admin/login');
  };

  const getNavItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
    }`;

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden relative bg-[#020617]">
      {/* Background ambient lighting */}
      <div className="ambient-light"></div>

      {/* Sidebar for Desktop / Header for Mobile */}
      <aside className="w-full lg:w-64 flex-none z-50 bg-slate-900/60 lg:border-r border-white/5 backdrop-blur-xl flex flex-col justify-between">
        <div>
          {/* Brand/Logo */}
          <div className="px-6 h-16 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-9 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] flex items-center justify-center">
                <img
                  src="https://cdn.jsdelivr.net/gh/kumpulanremaja/cdn/kontmu.svg"
                  alt="logo"
                  className="h-6 w-auto object-contain drop-shadow-[0_0_6px_rgba(168,85,247,0.4)]"
                />
              </div>
              <span className="font-display font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Lufeng Admin
              </span>
            </div>
            {/* Quick logout button on mobile header */}
            <button
              onClick={handleLogout}
              className="lg:hidden text-slate-400 hover:text-white p-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            </button>
          </div>

          {/* User Profile Info */}
          <div className="p-4 mx-4 my-3 rounded-2xl bg-slate-800/30 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center font-bold text-white text-sm">
                {adminUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-200">{adminUser.username}</span>
                <span className="text-xs text-slate-500">Administrator</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 py-2 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 border-b lg:border-none border-white/5 scrollbar-none">
            <NavLink to="/admin/dashboard" className={({ isActive }) => getNavItemClass(isActive)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/admin/proxies" className={({ isActive }) => getNavItemClass(isActive)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.875c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25M18.75 21V9.75m0 0l-3-3m3 3l3-3m-9 9.75V9.75m0 0l-3-3m3 3l3-3M6.75 21V9.75m0 0l-3-3m3 3l3-3M12 9.75V3.75m0 0L9 6.75M12 3.75l3 3"
                />
              </svg>
              <span>Proxy IP</span>
            </NavLink>
            <NavLink to="/admin/domains" className={({ isActive }) => getNavItemClass(isActive)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 0a9.015 9.015 0 018.716 6.747M12 3a9.015 9.015 0 00-8.716 6.747M3.75 12h16.5"
                />
              </svg>
              <span>Domains</span>
            </NavLink>
            <NavLink to="/admin/bugs" className={({ isActive }) => getNavItemClass(isActive)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 15.752zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <span>Bug List</span>
            </NavLink>
            <NavLink to="/admin/settings" className={({ isActive }) => getNavItemClass(isActive)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>

        {/* Desktop Logout Button */}
        <div className="hidden lg:block p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/10 transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow w-full h-full lg:overflow-y-auto p-4 lg:p-8 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
};
