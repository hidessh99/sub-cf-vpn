import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthService } from '../../services/AuthService';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  if (!AuthService.isAuthenticated()) {
    AuthService.clearSession();
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};
