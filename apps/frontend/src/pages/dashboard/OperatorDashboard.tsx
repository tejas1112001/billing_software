import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart, Receipt, TrendingUp, Clock, CalendarDays,
  FileText, BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiMetricCard } from '@/components/common/KpiMetricCard';
import { Pagination } from '@/components/common/Pagination';
import { dashboardService } from '@/services/dashboardService';
import { formatCurrency } from '@/utils/formatCurrency';
import { getKpiCurrencyDisplay } from '@/utils/kpiDisplay';
import { useAuthStore } from '@/stores/authStore';
import type { PersonalStats, UserLog, PaginatedResponse } from '@/types';

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
  const [activityPage, setActivityPage] = useState(1);
  const activityPageSize = 10;

  const { data, isLoading } = useQuery<PersonalStats>({
    queryKey: ['personal-stats'],
    queryFn: dashboardService.getPersonalStats,
    refetchInterval: 30000,
  });

  const { data: activityData, isLoading: loadingActivity } = useQuery<PaginatedResponse<UserLog>>({
    queryKey: ['personal-activity', activityPage, activityPageSize],
    queryFn: () => dashboardService.getPersonalActivity({ page: activityPage, pageSize: activityPageSize }),
    refetchInterval: 30000,
  });

  const salesFull = formatCurrency(data?.totalSales ?? 0);
  const salesKpi = getKpiCurrencyDisplay(data?.totalSales ?? 0, salesFull);
  const todaySalesFull = formatCurrency(data?.salesToday ?? 0);
  const todaySalesKpi = getKpiCurrencyDisplay(data?.salesToday ?? 0, todaySalesFull);

  const chartData = data?.weeklyTrends ?? [];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Welcome banner */}
      <div className="rounded-xl border bg-card px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground mb-0.5">{getGreeting()}</p>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">{user?.username}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {user?.operatorType && (
              <Badge variant={user.operatorType === 'CASH' ? 'success' : 'warning'}>
                {user.operatorType}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">Your performance overview</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground shrink-0">
          <CalendarDays className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Lifetime KPIs */}
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wide">All Time</p>
        <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[76px] sm:h-[88px]" />)
          ) : (
            <>
              <KpiMetricCard
                label="Total Bills"
                value={data?.totalBillsGenerated ?? 0}
                sub="Generated"
                icon={FileText}
                iconClassName="bg-blue-500/10 text-blue-600 ring-blue-500/20"
              />
              <KpiMetricCard
                label="Total Receipts"
                value={data?.totalReceiptsGenerated ?? 0}
                sub="Generated"
                icon={Receipt}
                iconClassName="bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
              />
              <KpiMetricCard
                label="Total Sales"
                value={salesKpi.desktop}
                mobileValue={salesKpi.mobile !== salesKpi.desktop ? salesKpi.mobile : undefined}
                sub="All time"
                icon={TrendingUp}
                iconClassName="bg-indigo-500/10 text-indigo-600 ring-indigo-500/20"
              />
            </>
          )}
        </div>
      </div>

      {/* Today KPIs */}
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wide">Today</p>
        <div className="grid grid-cols-3 gap-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[68px] sm:h-[76px]" />)
          ) : (
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
                value={todaySalesKpi.desktop}
                mobileValue={todaySalesKpi.mobile !== todaySalesKpi.desktop ? todaySalesKpi.mobile : undefined}
                sub="Today"
                icon={BarChart3}
                iconClassName="bg-violet-500/10 text-violet-600 ring-violet-500/20"
              />
            </>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">7-Day Sales Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : !chartData.length ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="opGradSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                  <Area type="monotone" dataKey="sales" name="Sales" stroke="#4F46E5" fill="url(#opGradSales)" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Bills & Receipts (7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : !chartData.length ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="orders" name="Bills" fill="#4F46E5" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent bills */}
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
              {data.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{order.billNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.store?.name}</p>
                  </div>
                  <p className="font-bold text-sm text-primary shrink-0">{formatCurrency(order.totalAmount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity log with pagination */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" /> Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingActivity ? (
            <div className="p-4"><Skeleton className="h-32" /></div>
          ) : !activityData?.data.length ? (
            <p className="text-center text-muted-foreground text-sm py-6">No activity yet</p>
          ) : (
            <>
              <div className="divide-y">
                {activityData.data.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{ACTION_LABELS[log.action] ?? log.action}</p>
                      {log.meta && typeof log.meta === 'object' && 'billNumber' in log.meta && (
                        <p className="text-xs text-muted-foreground">Bill: {String(log.meta.billNumber)}</p>
                      )}
                      {log.meta && typeof log.meta === 'object' && 'receiptNumber' in log.meta && (
                        <p className="text-xs text-muted-foreground">Receipt: {String(log.meta.receiptNumber)}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {new Date(log.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
              {activityData.totalPages > 1 && (
                <div className="border-t px-2">
                  <Pagination
                    page={activityPage}
                    pageSize={activityPageSize}
                    total={activityData.total}
                    totalPages={activityData.totalPages}
                    onPageChange={setActivityPage}
                    onPageSizeChange={() => {}}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
