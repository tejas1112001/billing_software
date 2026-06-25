import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart, AlertTriangle, TrendingUp,
  Wallet, Users, CreditCard, Banknote, Clock,
  PackageSearch, Package, Activity, FileText, Receipt,
  ChevronRight, BarChart2,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { dashboardService } from '@/services/dashboardService';
import { formatCurrency } from '@/utils/formatCurrency';
import { getOperatorTypeDisplay } from '@/utils/operatorTypeDisplay';
import { getKpiCurrencyDisplay } from '@/utils/kpiDisplay';
import type { DashboardStats, OperatorStat, OperatorType, ActivityLog } from '@/types';

const PIE_COLORS = ['#4F46E5', '#10B981'];

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'logged in',
  LOGOUT: 'logged out',
  BILL_CREATION: 'created a bill',
  RECEIPT_CREATION: 'created a receipt',
  PRODUCT_CREATION: 'added a product',
  PRODUCT_UPDATE: 'updated a product',
  BRAND_CREATION: 'added a brand',
  CATEGORY_CREATION: 'added a category',
  STORE_CREATION: 'added a store',
  USER_CREATION: 'created a user',
  PAYMENT_METHOD_CREATION: 'added a payment method',
  PAYMENT_METHOD_UPDATE: 'updated a payment method',
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-emerald-500/10 text-emerald-600',
  LOGOUT: 'bg-slate-500/10 text-slate-500',
  BILL_CREATION: 'bg-blue-500/10 text-blue-600',
  RECEIPT_CREATION: 'bg-violet-500/10 text-violet-600',
  PRODUCT_CREATION: 'bg-amber-500/10 text-amber-600',
  PRODUCT_UPDATE: 'bg-orange-500/10 text-orange-600',
  STORE_CREATION: 'bg-pink-500/10 text-pink-600',
  USER_CREATION: 'bg-indigo-500/10 text-indigo-600',
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  BILL_CREATION: FileText,
  RECEIPT_CREATION: Receipt,
  LOGIN: Activity,
  LOGOUT: Activity,
  PRODUCT_CREATION: Package,
  PRODUCT_UPDATE: Package,
  STORE_CREATION: ShoppingCart,
  USER_CREATION: Users,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Premium gradient KPI card for admin
function AdminKpiCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  onClick,
  pulse,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
  onClick?: () => void;
  pulse?: boolean;
}) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-3 sm:p-5 flex flex-col gap-2 sm:gap-3 w-full text-left ${gradient} ${onClick ? 'hover:opacity-90 active:scale-[0.98] transition-transform cursor-pointer' : ''}`}
      style={{ boxShadow: '0 4px 24px 0 rgba(80,70,220,0.12)' }}
    >
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute right-10 -bottom-6 h-16 w-16 rounded-full bg-white/10" />

      <div className="relative z-10 flex items-center justify-between">
        <p className="text-[9px] sm:text-xs font-semibold uppercase tracking-widest text-white/70 leading-tight pr-1">
          {label}
        </p>
        <div className="relative p-1 sm:p-1.5 rounded-lg bg-white/20 backdrop-blur-sm shrink-0">
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
          {pulse && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-xl sm:text-3xl font-bold text-white tabular-nums leading-none break-all">{value}</p>
        {sub && (
          <p className="text-[9px] sm:text-xs text-white/60 mt-1 flex items-center gap-1">
            {sub}
            {onClick && <ChevronRight className="h-3 w-3" />}
          </p>
        )}
      </div>
    </Wrapper>
  );
}

// Rank badge for top products
function RankBadge({ rank }: { rank: number }) {
  const styles = [
    'bg-amber-400 text-amber-900',
    'bg-slate-300 text-slate-700',
    'bg-orange-300 text-orange-800',
  ];
  return (
    <span
      className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold shrink-0 ${styles[rank - 1] ?? 'bg-muted text-muted-foreground'}`}
    >
      {rank}
    </span>
  );
}

export default function AdminDashboard() {
  const [operatorFilter, setOperatorFilter] = useState<OperatorType | undefined>();
  const [lowStockOpen, setLowStockOpen] = useState(false);

  const { data: stats, isLoading: loadingStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 30000,
  });

  const { data: lowStockData, isLoading: loadingLowStock, isFetching: fetchingLowStock } = useQuery({
    queryKey: ['low-stock-products'],
    queryFn: dashboardService.getLowStockProducts,
    enabled: lowStockOpen,
  });

  const { data: opData, isLoading: loadingOps } = useQuery({
    queryKey: ['operator-stats', operatorFilter],
    queryFn: () => dashboardService.getOperatorStats(operatorFilter),
    refetchInterval: 30000,
  });

  const { data: trendsData, isLoading: loadingTrends } = useQuery({
    queryKey: ['weekly-trends', operatorFilter],
    queryFn: dashboardService.getWeeklyTrends,
    refetchInterval: 60000,
  });

  const { data: topProductsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['top-products'],
    queryFn: dashboardService.getTopProducts,
    refetchInterval: 60000,
  });

  const { data: activityData, isLoading: loadingActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: dashboardService.getRecentActivity,
    refetchInterval: 30000,
  });

  const pieData = opData
    ? [
        { name: 'Gold Ops', value: opData.distribution.cashSales },
        { name: 'Platinum Ops', value: opData.distribution.creditSales },
      ].filter((d) => d.value > 0)
    : [];

  const barData = opData?.operators.map((op: OperatorStat) => ({
    name: op.username.length > 8 ? op.username.slice(0, 8) + '…' : op.username,
    Bills: op.ordersToday,
    Receipts: op.receiptsToday,
  })) || [];

  const salesToday = stats?.totalSalesToday ?? 0;
  const salesKpi = getKpiCurrencyDisplay(salesToday, formatCurrency(salesToday));
  const collectedToday = stats?.totalCollectedToday ?? 0;
  const collectedKpi = getKpiCurrencyDisplay(collectedToday, formatCurrency(collectedToday));

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-4 sm:space-y-5 pb-4">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl px-5 py-5 sm:px-7 sm:py-6 border bg-card shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-primary/5" />
        <div className="pointer-events-none absolute right-24 bottom-0 h-32 w-32 rounded-full bg-primary/5" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5">Admin Dashboard</p>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Business Overview</h1>
            <p className="text-xs text-muted-foreground mt-1">{today}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[95px] sm:h-[125px] rounded-2xl animate-pulse" />
          ))
        ) : (
          <>
            <AdminKpiCard
              label="Orders Today"
              value={stats?.totalOrdersToday ?? 0}
              sub="Bills generated"
              icon={FileText}
              gradient="bg-gradient-to-br from-blue-600 to-indigo-700"
            />
            <AdminKpiCard
              label="Sales Today"
              value={salesKpi.mobile}
              sub={salesKpi.mobile !== salesKpi.full ? salesKpi.full : 'Today\'s sales'}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-indigo-600 to-violet-700"
            />
            <AdminKpiCard
              label="Collected Today"
              value={collectedKpi.mobile}
              sub={collectedKpi.mobile !== collectedKpi.full ? collectedKpi.full : 'Today\'s collection'}
              icon={Wallet}
              gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
            />
            <AdminKpiCard
              label="Low Stock"
              value={stats?.lowStockProducts ?? 0}
              sub="Tap to view items"
              icon={AlertTriangle}
              gradient={(stats?.lowStockProducts ?? 0) > 0
                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                : 'bg-gradient-to-br from-slate-500 to-slate-700'}
              onClick={() => setLowStockOpen(true)}
              pulse={(stats?.lowStockProducts ?? 0) > 0}
            />
          </>
        )}
      </div>

      {/* ── Weekly Sales Trend ── */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="px-4 pt-4 pb-3 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            7-Day Sales Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-4 pt-0">
          {loadingTrends ? (
            <Skeleton className="h-44 rounded-xl" />
          ) : !trendsData?.days.length ? (
            <div className="h-44 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <TrendingUp className="h-8 w-8 opacity-20" />
              <span className="text-sm">No data available</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trendsData.days} margin={{ top: 4, right: 6, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [formatCurrency(v as number)]}
                  contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="sales" name="Sales" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="collected" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Business Insights ── */}
      <div>
        <div className="flex flex-col xs:flex-row xs:items-center gap-3 mb-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Business Insights
          </h2>
          <div className="flex gap-1.5 xs:ml-auto">
            {(['all', 'CASH', 'CREDIT'] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={(!operatorFilter && f === 'all') || operatorFilter === f ? 'default' : 'outline'}
                className="h-8 text-xs px-3 flex-1 xs:flex-none rounded-xl"
                onClick={() => setOperatorFilter(f === 'all' ? undefined : f as OperatorType)}
              >
                {f === 'all' ? 'All' : f === 'CASH' ? (
                  <><Banknote className="h-3 w-3 mr-1" />Gold</>
                ) : (
                  <><CreditCard className="h-3 w-3 mr-1" />Platinum</>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Donut chart */}
          <Card className="rounded-2xl border shadow-sm overflow-hidden">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Sales Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              {loadingOps ? (
                <Skeleton className="h-48 rounded-xl" />
              ) : pieData.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <TrendingUp className="h-8 w-8 opacity-20" />
                  <span className="text-sm">No sales today</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={52} outerRadius={82}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [formatCurrency(v as number)]}
                      contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12 }}
                      formatter={(val, entry) => (
                        <span style={{ color: entry.color, fontWeight: 600 }}>{val}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Bills & Receipts by Operator */}
          <Card className="rounded-2xl border shadow-sm overflow-hidden">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
                Bills & Receipts by Operator
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              {loadingOps ? (
                <Skeleton className="h-48 rounded-xl" />
              ) : barData.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Users className="h-8 w-8 opacity-20" />
                  <span className="text-sm">No data today</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ top: 0, right: 6, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Bills" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Receipts" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Operator Activity Table ── */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Operator Activity — Today
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingOps ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : !opData?.operators.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 opacity-20 mb-2" />
              <p className="text-sm">No operators found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[540px]">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-2.5 font-semibold text-xs text-muted-foreground">Operator</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-xs text-muted-foreground">Type</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-xs text-muted-foreground">Bills</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-xs text-muted-foreground">Receipts</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-xs text-muted-foreground">Sales</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-xs text-muted-foreground">Collected</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-xs text-muted-foreground">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {opData.operators.map((op: OperatorStat) => {
                    const pending = op.salesToday - op.collectedToday;
                    return (
                      <tr key={op.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-sm">{op.username}</td>
                        <td className="px-3 py-3">
                          {op.operatorType ? (
                            <Badge
                              variant={op.operatorType === 'CASH' ? 'success' : 'warning'}
                              className="text-[10px] px-2 py-0.5"
                            >
                              {getOperatorTypeDisplay(op.operatorType)}
                            </Badge>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">{op.ordersToday}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{op.receiptsToday}</td>
                        <td className="px-4 py-3 text-right font-semibold text-primary tabular-nums">
                          {formatCurrency(op.salesToday)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600 tabular-nums">
                          {formatCurrency(op.collectedToday)}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold tabular-nums ${pending > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {formatCurrency(pending)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Top Products + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Top products */}
        <Card className="rounded-2xl border shadow-sm overflow-hidden">
          <CardHeader className="px-4 pt-4 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PackageSearch className="h-4 w-4 text-primary" />
              Top Products — This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingProducts ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : !topProductsData?.products.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 opacity-20 mb-2" />
                <p className="text-sm">No sales this month</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {topProductsData.products.map((p, idx) => (
                  <div key={p.productId} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <RankBadge rank={idx + 1} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.modelName}</p>
                      <p className="text-xs text-muted-foreground">{p.brandName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary">{formatCurrency(p.totalRevenue)}</p>
                      <p className="text-xs text-muted-foreground">{p.totalQty} units</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="rounded-2xl border shadow-sm overflow-hidden">
          <CardHeader className="px-4 pt-4 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingActivity ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : !activityData?.logs.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 opacity-20 mb-2" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 max-h-[360px] overflow-y-auto">
                {activityData.logs.map((log: ActivityLog) => {
                  const LogIcon = ACTION_ICONS[log.action] ?? Activity;
                  const colorClass = ACTION_COLORS[log.action] ?? 'bg-slate-500/10 text-slate-500';
                  return (
                    <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                        <LogIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-tight">
                          <span className="font-semibold">{log.user.username}</span>
                          {' '}
                          <span className="text-muted-foreground">{ACTION_LABELS[log.action] ?? log.action}</span>
                          {log.meta && typeof log.meta === 'object' && 'billNumber' in log.meta && (
                            <span className="text-xs text-primary ml-1">#{String(log.meta.billNumber)}</span>
                          )}
                          {log.meta && typeof log.meta === 'object' && 'receiptNumber' in log.meta && (
                            <span className="text-xs text-emerald-600 ml-1">#{String(log.meta.receiptNumber)}</span>
                          )}
                        </p>
                        {log.user.operatorType && (
                          <Badge
                            variant={log.user.operatorType === 'CASH' ? 'success' : 'warning'}
                            className="text-[9px] h-3.5 px-1.5 mt-0.5"
                          >
                            {getOperatorTypeDisplay(log.user.operatorType)}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{timeAgo(log.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Low Stock Dialog ── */}
      <Dialog open={lowStockOpen} onOpenChange={setLowStockOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <Package className="h-4 w-4 text-amber-600" />
              </div>
              Low Stock Products
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-2 px-2">
            {loadingLowStock || fetchingLowStock ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : !lowStockData?.products.length ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Package className="h-10 w-10 opacity-20 mb-2" />
                <p className="text-sm">No low-stock products found.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {lowStockData.products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3 gap-3 hover:bg-muted/30 rounded-lg px-1 transition-colors">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                        <Package className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold truncate">{p.modelName}</p>
                        <p className="text-xs text-muted-foreground">{p.brand?.name}</p>
                      </div>
                    </div>
                    <Badge
                      variant={p.availableQty === 0 ? 'destructive' : 'warning'}
                      className="shrink-0 text-xs"
                    >
                      {p.availableQty === 0 ? 'Out of stock' : `${p.availableQty} left`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
