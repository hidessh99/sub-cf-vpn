import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Generator from './pages/Generator';
import { ToastProvider } from './components/Toast';

// Admin imports
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { ProxyManagement } from './pages/admin/ProxyManagement';
import { DomainManagement } from './pages/admin/DomainManagement';
import { BugManagement } from './pages/admin/BugManagement';
import { Settings } from './pages/admin/Settings';
import { ProtectedRoute } from './components/admin/ProtectedRoute';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <HashRouter>
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

          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/proxies" 
            element={
              <ProtectedRoute>
                <ProxyManagement />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/domains" 
            element={
              <ProtectedRoute>
                <DomainManagement />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/bugs" 
            element={
              <ProtectedRoute>
                <BugManagement />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />

          {/* Redirect /admin to dashboard */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Fallback to generator */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;
// For Fast Refresh compatibility
export const AppConfig = { hot: true };