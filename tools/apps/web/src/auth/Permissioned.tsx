import React from 'react';
import { usePermissions } from './PermissionsContext';
import { Role } from './roles';

interface PermissionedProps {
  allowed: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Permissioned: React.FC<PermissionedProps> = ({ allowed, children, fallback = null }) => {
  const { user } = usePermissions();
  if (!user || !allowed.includes(user.role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};
