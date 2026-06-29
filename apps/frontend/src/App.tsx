import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { AdminRoute } from '@/components/routing/AdminRoute';
import { Skeleton } from '@/components/ui/skeleton';

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));

// Common (authenticated)
const HomePage = lazy(() => import('@/pages/dashboard/HomePage'));
const GenerateBillPage = lazy(() => import('@/pages/billing/GenerateBillPage'));
const GeneratedBillsPage = lazy(() => import('@/pages/billing/GeneratedBillsPage'));
const NewArrivalsPage = lazy(() => import('@/pages/billing/NewArrivalsPage'));
const GenerateReceiptPage = lazy(() => import('@/pages/receipts/GenerateReceiptPage'));
const GeneratedReceiptsPage = lazy(() => import('@/pages/receipts/GeneratedReceiptsPage'));
const LedgerPage = lazy(() => import('@/pages/ledger/LedgerPage'));
const StockReportPage = lazy(() => import('@/pages/stock-reports/StockReportPage'));

// Admin
const AdminIndexPage = lazy(() => import('@/pages/admin/AdminIndexPage'));
const BrandsPage = lazy(() => import('@/pages/admin/BrandsPage'));
const CategoriesPage = lazy(() => import('@/pages/admin/CategoriesPage'));
const StoresPage = lazy(() => import('@/pages/admin/StoresPage'));
const ProductsPage = lazy(() => import('@/pages/admin/ProductsPage'));
const UserLogsPage = lazy(() => import('@/pages/admin/UserLogsPage'));
const PaymentMethodsPage = lazy(() => import('@/pages/admin/PaymentMethodsPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const ResetDataPage = lazy(() => import('@/pages/admin/ResetDataPage'));

// Reports (admin)
const ReportsIndex = lazy(() => import('@/pages/reports/ReportsIndex'));
const CashCreditReport = lazy(() => import('@/pages/admin/reports/CashCreditReport'));
const PurchaseQuantityReport = lazy(() => import('@/pages/admin/reports/PurchaseQuantityReport'));
const ProfitReport = lazy(() => import('@/pages/admin/reports/ProfitReport'));
const ProductReport = lazy(() => import('@/pages/admin/reports/ProductReport'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

function PageLoader() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/bills" element={<GenerateBillPage />} />
                <Route path="/bills/new-arrivals" element={<NewArrivalsPage />} />
                <Route path="/bills/generated" element={<GeneratedBillsPage />} />
                <Route path="/receipts" element={<GenerateReceiptPage />} />
                <Route path="/receipts/generated" element={<GeneratedReceiptsPage />} />
                <Route path="/ledger" element={<LedgerPage />} />
                <Route path="/stock-reports" element={<StockReportPage />} />

                {/* Admin-only */}
                <Route element={<AdminRoute />}>
                  <Route path="/reports" element={<ReportsIndex />} />
                  <Route path="/reports/cash-credit" element={<CashCreditReport />} />
                  <Route path="/reports/purchase-quantity" element={<PurchaseQuantityReport />} />
                  <Route path="/reports/profit" element={<ProfitReport />} />
                  <Route path="/reports/product" element={<ProductReport />} />

                  <Route path="/admin" element={<AdminIndexPage />} />
                  <Route path="/admin/brands" element={<BrandsPage />} />
                  <Route path="/admin/categories" element={<CategoriesPage />} />
                  <Route path="/admin/stores" element={<StoresPage />} />
                  <Route path="/admin/products" element={<ProductsPage />} />
                  <Route path="/admin/users" element={<UsersPage />} />
                  <Route path="/admin/payment-methods" element={<PaymentMethodsPage />} />
                  <Route path="/admin/user-logs" element={<UserLogsPage />} />
                  <Route path="/admin/reset-data" element={<ResetDataPage />} />

                  {/* Legacy redirects */}
                  <Route path="/admin/reports/cash-credit" element={<Navigate to="/reports/cash-credit" replace />} />
                  <Route path="/admin/reports/purchase-quantity" element={<Navigate to="/reports/purchase-quantity" replace />} />
                  <Route path="/admin/reports/profit" element={<Navigate to="/reports/profit" replace />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  );
}
