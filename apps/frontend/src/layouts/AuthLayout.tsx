import React from 'react';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">BillSoft</h1>
          <p className="text-muted-foreground mt-1">Billing & Inventory Management</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
