import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart, Receipt, TrendingUp, Clock, CalendarDays,
  FileText, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/common/Pagination';
import { dashboardService } from '@/services/dashboardService';
import { formatCurrency } from '@/utils/formatCurrency';
import { getOperatorTypeDisplay } from '@/utils/operatorTypeDisplay';
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

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-emerald-500/10 text-emerald-600',
  LOGOUT: 'bg-slate-500/10 text-slate-500',
  BILL_CREATION: 'bg-blue-500/10 text-blue-600',
  RECEIPT_CREATION: 'bg-violet-500/10 text-violet-600',
  PRODUCT_CREATION: 'bg-amber-500/10 text-amber-600',
  PRODUCT_UPDATE: 'bg-orange-500/10 text-orange-600',
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  BILL_CREATION: FileText,
  RECEIPT_CREATION: Receipt,
  LOGIN: Activity,
  LOGOUT: Activity,
  PRODUCT_CREATION: ShoppingCart,
  PRODUCT_UPDATE: ShoppingCart,
};

// Compact KPI card used only on the operator dashboard
function OperatorKpiCard({
  label,
  value,
  icon: Icon,
  gradient,
  sub,
  title,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  sub?: string;
  title?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-3 sm:p-5 flex flex-col gap-2 sm:gap-3 ${gradient} transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg`}
      style={{ boxShadow: '0 4px 24px 0 rgba(80,70,220,0.10)' }}
      title={title}
    >
      {/* Decorative circle */}
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -right-2 -bottom-5 h-14 w-14 rounded-full bg-white/10 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between">
        <p className="text-[9px] sm:text-xs font-semibold uppercase tracking-widest text-white/70 leading-tight">
          {label}
        </p>
        <div className="p-1 sm:p-1.5 rounded-lg bg-white/20 backdrop-blur-sm shrink-0">
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-xl sm:text-3xl font-extrabold text-white tabular-nums leading-none break-all">
          {value}
        </p>
        {sub && (
          <p className="text-[9px] sm:text-xs text-white/60 mt-1 sm:mt-1.5 font-medium">{sub}</p>
        )}
      </div>
    </div>
  );
}

export default function OperatorDashboard() {
  const { user } = useAuthStore();
  const [activityPage, setActivityPage] = useState(1);
  const activityPageSize = 10;

  const { data, isLoading } = useQuery<PersonalStats>({
    queryKey: ['personal-stats'],
    queryFn: dashboardService.getPersonalStats,
    refetchInterval: 30000,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: activityData, isLoading: loadingActivity } = useQuery<PaginatedResponse<UserLog>>({
    queryKey: ['personal-activity', activityPage, activityPageSize],
    queryFn: () => dashboardService.getPersonalActivity({ page: activityPage, pageSize: activityPageSize }),
    refetchInterval: 30000,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const todaySalesFull = formatCurrency(data?.salesToday ?? 0);
  const todaySalesKpi = getKpiCurrencyDisplay(data?.salesToday ?? 0, todaySalesFull);

  const chartData = data?.weeklyTrends ?? [];

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="space-y-4 sm:space-y-5 pb-4">

      {/* ── Hero Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl px-5 py-5 sm:px-7 sm:py-6 border bg-card shadow-sm">
        {/* decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/5" />
        <div className="pointer-events-none absolute right-20 bottom-0 h-28 w-28 rounded-full bg-primary/5" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5 font-medium">{getGreeting()},</p>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
              {user?.username}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {user?.operatorType && (
                <Badge
                  variant={user.operatorType === 'CASH' ? 'success' : 'warning'}
                  className="text-[10px] px-2 py-0.5"
                >
                  {getOperatorTypeDisplay(user.operatorType)}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">Your performance today</span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 text-muted-foreground mt-1">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="text-xs font-medium hidden xs:block">{today}</span>
          </div>
        </div>
      </div>

      {/* ── 3 KPI Cards ── */}
      <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] sm:h-[125px] rounded-2xl animate-pulse" />
          ))
        ) : (
          <>
            <OperatorKpiCard
              label="Bills"
              value={data?.ordersToday ?? 0}
              sub="Today"
              icon={FileText}
              gradient="bg-gradient-to-br from-blue-600 to-indigo-700"
            />
            <OperatorKpiCard
              label="Receipts"
              value={data?.receiptsToday ?? 0}
              sub="Today"
              icon={Receipt}
              gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
            />
            <OperatorKpiCard
              label="Sales"
              value={todaySalesKpi.mobile}
              sub={todaySalesKpi.mobile !== todaySalesKpi.full ? todaySalesKpi.full : 'Today'}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-violet-600 to-purple-800"
              title={todaySalesKpi.full}
            />
          </>
        )}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Sales trend */}
        <Card className="rounded-2xl border shadow-sm overflow-hidden">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500" />
              7-Day Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            {isLoading ? (
              <Skeleton className="h-40 rounded-xl" />
            ) : !chartData.length ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <TrendingUp className="h-7 w-7 opacity-20" />
                <span>No data yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 4, right: 6, left: -14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="opGradSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [formatCurrency(v as number), 'Sales']}
                    contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Sales"
                    stroke="#4F46E5"
                    fill="url(#opGradSales)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#4F46E5', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bills bar */}
        <Card className="rounded-2xl border shadow-sm overflow-hidden">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
              Bills (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            {isLoading ? (
              <Skeleton className="h-40 rounded-xl" />
            ) : !chartData.length ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <ShoppingCart className="h-7 w-7 opacity-20" />
                <span>No data yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{ top: 4, right: 6, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="orders" name="Bills" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Bills ── */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            Recent Bills
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : !data?.recentOrders.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 opacity-20 mb-2" />
              <p className="text-sm">No bills yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {data.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{order.billNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.store?.name}</p>
                  </div>
                  <p className="font-bold text-sm text-primary shrink-0">{formatCurrency(order.totalAmount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Activity Log ── */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingActivity ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : !activityData?.data.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 opacity-20 mb-2" />
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/60">
                {activityData.data.map((log) => {
                  const LogIcon = ACTION_ICONS[log.action] ?? Activity;
                  const colorClass = ACTION_COLORS[log.action] ?? 'bg-slate-500/10 text-slate-500';
                  return (
                    <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                        <LogIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{ACTION_LABELS[log.action] ?? log.action}</p>
                        {log.meta && typeof log.meta === 'object' && 'billNumber' in log.meta && (
                          <p className="text-xs text-muted-foreground">Bill: {String(log.meta.billNumber)}</p>
                        )}
                        {log.meta && typeof log.meta === 'object' && 'receiptNumber' in log.meta && (
                          <p className="text-xs text-muted-foreground">Receipt: {String(log.meta.receiptNumber)}</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0 text-right">
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
              {activityData.totalPages > 1 && (
                <div className="border-t border-border/60 px-2">
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
