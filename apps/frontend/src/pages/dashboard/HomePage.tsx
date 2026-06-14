import React, { lazy, Suspense } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Skeleton } from '@/components/ui/skeleton';

const AdminDashboard = lazy(() => import('./AdminDashboard'));
const OperatorDashboard = lazy(() => import('./OperatorDashboard'));

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <Suspense fallback={<div className="space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>}>
      {user?.role === 'ADMIN' ? <AdminDashboard /> : <OperatorDashboard />}
    </Suspense>
  );
}
