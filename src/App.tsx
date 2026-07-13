import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Generator from './pages/Generator';
import { ToastProvider } from './components/Toast';
import { ProtectedRoute } from './components/admin/ProtectedRoute';

// Lazy loading admin pages for bundle size optimization
const Login = React.lazy(() => import('./pages/admin/Login').then((m) => ({ default: m.Login })));
const Dashboard = React.lazy(() =>
  import('./pages/admin/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const ProxyManagement = React.lazy(() =>
  import('./pages/admin/ProxyManagement').then((m) => ({ default: m.ProxyManagement }))
);
const DomainManagement = React.lazy(() =>
  import('./pages/admin/DomainManagement').then((m) => ({ default: m.DomainManagement }))
);
const BugManagement = React.lazy(() =>
  import('./pages/admin/BugManagement').then((m) => ({ default: m.BugManagement }))
);
const Settings = React.lazy(() =>
  import('./pages/admin/Settings').then((m) => ({ default: m.Settings }))
);

const SuspenseSpinner: React.FC = () => (
  <div className="flex-grow flex items-center justify-center min-h-[50vh]">
    <svg className="animate-spin h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
);

const App: React.FC = () => {
  return (
    <ToastProvider>
      <HashRouter>
        <Suspense fallback={<SuspenseSpinner />}>
          <Routes>
            {/* Public Route */}
            <Route
              path="/"
              element={
                <Layout>
                  <Generator />
                </Layout>
              }
            />

            {/* Admin Public Route */}
            <Route path="/admin/login" element={<Login />} />

            {/* Protected Admin Routes via Layout Route wrapper */}
            <Route
              element={
                <ProtectedRoute>
                  <Outlet />
                </ProtectedRoute>
              }
            >
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/proxies" element={<ProxyManagement />} />
              <Route path="/admin/domains" element={<DomainManagement />} />
              <Route path="/admin/bugs" element={<BugManagement />} />
              <Route path="/admin/settings" element={<Settings />} />
            </Route>

            {/* Redirect /admin to dashboard */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Fallback to generator */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;
// For Fast Refresh compatibility
export const AppConfig = { hot: true };
