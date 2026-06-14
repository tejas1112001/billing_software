import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function AdminRoute() {
  const { user } = useAuthStore();
  return user?.role === 'ADMIN' ? <Outlet /> : <Navigate to="/" replace />;
}
