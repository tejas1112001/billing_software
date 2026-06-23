import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Receipt, TrendingUp, Clock, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiMetricCard } from '@/components/common/KpiMetricCard';
import { dashboardService } from '@/services/dashboardService';
import { formatCurrency } from '@/utils/formatCurrency';
import { getKpiCurrencyDisplay } from '@/utils/kpiDisplay';
import { useAuthStore } from '@/stores/authStore';
import type { PersonalStats } from '@/types';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Logged in',
  LOGOUT: 'Logged out',
  BILL_CREATION: 'Created bill',
  RECEIPT_CREATION: 'Saved receipt',
  PRODUCT_CREATION: 'Added product',
  PRODUCT_UPDATE: 'Updated product',
};

export default function OperatorDashboard() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery<PersonalStats>({
    queryKey: ['personal-stats'],
    queryFn: dashboardService.getPersonalStats,
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-4">
      {/* Welcome banner */}
      <div className="rounded-xl border bg-card px-6 py-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground mb-0.5">{getGreeting()}</p>
          <h1 className="text-xl font-bold tracking-tight truncate">{user?.username}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {user?.operatorType && (
              <Badge variant={user.operatorType === 'CASH' ? 'success' : 'warning'}>
                {user.operatorType}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">Today&apos;s Summary</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground shrink-0">
          <CalendarDays className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[76px] sm:h-[88px]" />)
        ) : (
          (() => {
            const salesFull = formatCurrency(data?.salesToday ?? 0);
            const salesKpi = getKpiCurrencyDisplay(data?.salesToday ?? 0, salesFull);
            return (
              <>
                <KpiMetricCard
                  label="Bills"
                  value={data?.ordersToday ?? 0}
                  sub="Today"
                  icon={ShoppingCart}
                  iconClassName="bg-blue-500/10 text-blue-600 ring-blue-500/20"
                />
                <KpiMetricCard
                  label="Receipts"
                  value={data?.receiptsToday ?? 0}
                  sub="Today"
                  icon={Receipt}
                  iconClassName="bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
                />
                <KpiMetricCard
                  label="Sales"
                  value={salesKpi.desktop}
                  mobileValue={salesKpi.mobile !== salesKpi.desktop ? salesKpi.mobile : undefined}
                  sub="Today"
                  icon={TrendingUp}
                  iconClassName="bg-indigo-500/10 text-indigo-600 ring-indigo-500/20"
                />
              </>
            );
          })()
        )}
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> Recent Bills
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><Skeleton className="h-24" /></div>
          ) : !data?.recentOrders.length ? (
            <p className="text-center text-muted-foreground text-sm py-6">No bills yet</p>
          ) : (
            <div className="divide-y">
              {data.recentOrders.slice(0, 8).map((order) => (
                <div key={order.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{order.billNumber}</p>
                    <p className="text-xs text-muted-foreground">{order.store?.name}</p>
                  </div>
                  <p className="font-bold text-sm text-primary">{formatCurrency(order.totalAmount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity log */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><Skeleton className="h-24" /></div>
          ) : !data?.recentActivity.length ? (
            <p className="text-center text-muted-foreground text-sm py-6">No activity yet</p>
          ) : (
            <div className="divide-y">
              {data.recentActivity.map((log, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1">
                    <p className="text-sm">{ACTION_LABELS[log.action] ?? log.action}</p>
                    {log.meta && typeof log.meta === 'object' && 'billNumber' in log.meta && (
                      <p className="text-xs text-muted-foreground">Bill: {String(log.meta.billNumber)}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
