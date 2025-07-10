import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from './PermissionsContext';
import { Role } from './roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { user } = usePermissions();
  if (!user || !requiredRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};
