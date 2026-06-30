import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionRouteProps {
  permission: string;
}

/**
 * Route guard that checks module-level permissions.
 * - ADMIN users always pass through (handled inside usePermissions).
 * - OPERATOR users without the required permission are redirected to "/".
 */
export function PermissionRoute({ permission }: PermissionRouteProps) {
  const { hasPermission } = usePermissions();
  return hasPermission(permission) ? <Outlet /> : <Navigate to="/" replace />;
}
