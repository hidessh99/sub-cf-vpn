import React, { createContext, useContext, useState, useCallback } from 'react';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2800); // slightly increased to let the animation play nicely
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div 
        id="toast-container" 
        className="fixed top-6 right-4 left-4 sm:left-auto sm:right-6 z-[200] flex flex-col gap-3 pointer-events-none sm:w-[320px]"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 bg-slate-900/95 border border-white/10 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-l-4 ${
                isSuccess ? 'border-l-emerald-500' : 'border-l-rose-500'
              } text-white pointer-events-auto overflow-hidden animate-slide-in-right relative`}
            >
              {/* Icon Container */}
              <div 
                className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${
                  isSuccess ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {isSuccess ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              {/* Text Message */}
              <div className="flex-grow flex flex-col gap-0.5 pr-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {isSuccess ? 'Success' : 'Error'}
                </span>
                <span className="text-xs font-semibold text-slate-200">{t.message}</span>
              </div>

              {/* Expiry Progress Bar */}
              <div 
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  isSuccess ? 'bg-emerald-500' : 'bg-rose-500'
                } animate-toast-progress origin-left`} 
                style={{ animationDuration: '2800ms' }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
