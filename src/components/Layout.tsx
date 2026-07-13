import React from 'react';
import { NavLink } from 'react-router-dom';
import { CONFIG } from '../utils/config';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const getNavItemClass = (isActive: boolean) => `nav-item px-6 py-2 rounded-full text-xs uppercase tracking-wider ${isActive ? 'active' : ''}`;

  return (
    <div className="flex flex-col w-full min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden relative bg-[#020617]">
      <div className="ambient-light"></div>

      <header className="hidden lg:block flex-none z-50 w-full backdrop-blur-xl bg-slate-900/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3.5 group cursor-pointer">
            <div className="h-10 px-3 py-1 rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-800/60 to-slate-900/90 border border-cyan-500/20 shadow-[0_0_20px_rgba(10,202,247,0.15)] flex items-center justify-center backdrop-blur-md group-hover:border-cyan-400/40 group-hover:shadow-[0_0_25px_rgba(10,202,247,0.25)] transition-all duration-300">
              <img 
                src="https://cdn.jsdelivr.net/gh/kumpulanremaja/cdn/kontmu.svg" 
                alt="logo" 
                fetchPriority="high"
                loading="eager"
                className="h-7 w-auto object-contain drop-shadow-[0_0_8px_rgba(10,202,247,0.4)] group-hover:scale-105 transition-transform duration-300" 
              />
            </div>
            <h1 className="font-display font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-teal-300 tracking-tight drop-shadow-sm">
              {CONFIG.webName}
            </h1>
          </div>
          <div className="flex gap-1 bg-slate-800/50 p-1 rounded-full border border-white/5 backdrop-blur-md">
            <NavLink to="/" className={({ isActive }) => getNavItemClass(isActive)}>Generator</NavLink>
          </div>
        </div>
      </header>

      <header className="lg:hidden flex-none z-50 backdrop-blur-md bg-slate-900/80 border-b border-white/5 px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="h-9 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-cyan-500/20 shadow-[0_0_15px_rgba(10,202,247,0.15)] flex items-center justify-center">
            <img 
              src="https://cdn.jsdelivr.net/gh/kumpulanremaja/cdn/kontmu.svg" 
              alt="logo" 
              fetchPriority="high"
              loading="eager"
              className="h-6 w-auto object-contain drop-shadow-[0_0_6px_rgba(10,202,247,0.4)]" 
            />
          </div>
          <h1 className="font-display font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">
            {CONFIG.webName}
          </h1>
        </div>
      </header>

      <main className="w-full flex-grow relative lg:flex lg:min-h-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;
