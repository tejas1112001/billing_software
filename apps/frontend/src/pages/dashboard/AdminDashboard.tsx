import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart, Receipt, AlertTriangle, Store, TrendingUp,
  Wallet, Users, CreditCard, Banknote, Clock, PackageSearch,
  TrendingDown, IndianRupee,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardService } from '@/services/dashboardService';
import { formatCurrency } from '@/utils/formatCurrency';
import type { DashboardStats, OperatorStat, OperatorType, ActivityLog } from '@/types';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Logged in',
  LOGOUT: 'Logged out',
  BILL_CREATION: 'Created bill',
  RECEIPT_CREATION: 'Created receipt',
  PRODUCT_CREATION: 'Added product',
  PRODUCT_UPDATE: 'Updated product',
  BRAND_CREATION: 'Added brand',
  CATEGORY_CREATION: 'Added category',
  STORE_CREATION: 'Added store',
  USER_CREATION: 'Created user',
  PAYMENT_METHOD_CREATION: 'Added payment method',
  PAYMENT_METHOD_UPDATE: 'Updated payment method',
};

function StatCard({ label, value, icon: Icon, color, sub, highlight }: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; sub?: string; highlight?: boolean;
}) {
  const bgColor = color.replace('text-', 'bg-').replace('-600', '-100').replace('-500', '-100');
  return (
    <Card className={`p-4 ${highlight ? 'border-orange-300 bg-orange-50/40' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground leading-tight">{label}</p>
          <p className="text-2xl font-bold mt-2 leading-none">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg shrink-0 ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
    </Card>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminDashboard() {
  const [operatorFilter, setOperatorFilter] = useState<OperatorType | undefined>();

  const { data: stats, isLoading: loadingStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 30000,
  });

  const { data: opData, isLoading: loadingOps } = useQuery({
    queryKey: ['operator-stats', operatorFilter],
    queryFn: () => dashboardService.getOperatorStats(operatorFilter),
    refetchInterval: 30000,
  });

  const { data: trendsData, isLoading: loadingTrends } = useQuery({
    queryKey: ['weekly-trends'],
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
        { name: 'Cash Ops', value: opData.distribution.cashSales },
        { name: 'Credit Ops', value: opData.distribution.creditSales },
      ].filter((d) => d.value > 0)
    : [];

  const barData = opData?.operators.map((op) => ({
    name: op.username,
    Bills: op.ordersToday,
    Receipts: op.receiptsToday,
  })) || [];

  return (
    <div className="space-y-5">
      {/* ── Today's snapshot ── */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {loadingStats ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatCard label="Orders Today" value={stats?.totalOrdersToday ?? 0} icon={ShoppingCart} color="text-blue-600" />
            <StatCard label="Receipts Today" value={stats?.totalReceiptsToday ?? 0} icon={Receipt} color="text-green-600" />
            <StatCard label="Sales Today" value={formatCurrency(stats?.totalSalesToday ?? 0)} icon={TrendingUp} color="text-indigo-600" />
            <StatCard label="Collected Today" value={formatCurrency(stats?.totalCollectedToday ?? 0)} icon={Wallet} color="text-emerald-600" />
            <StatCard label="Low Stock" value={stats?.lowStockProducts ?? 0} icon={AlertTriangle} color="text-yellow-600" sub="< 5 units" />
            <StatCard label="Active Stores" value={stats?.activeStores ?? 0} icon={Store} color="text-purple-600" />
          </>
        )}
      </div>

      {/* ── Month & Outstanding summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {loadingStats ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard
              label="Sales This Month"
              value={formatCurrency(stats?.totalSalesThisMonth ?? 0)}
              icon={IndianRupee}
              color="text-blue-600"
            />
            <StatCard
              label="Collected This Month"
              value={formatCurrency(stats?.totalCollectedThisMonth ?? 0)}
              icon={Wallet}
              color="text-emerald-600"
            />
            <StatCard
              label="Total Outstanding"
              value={formatCurrency(stats?.totalOutstanding ?? 0)}
              icon={TrendingDown}
              color="text-red-600"
              sub="All-time unpaid balance"
              highlight={(stats?.totalOutstanding ?? 0) > 0}
            />
          </>
        )}
      </div>

      {/* ── 7-day trend ── */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">7-Day Sales &amp; Collections</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loadingTrends ? (
            <Skeleton className="h-52" />
          ) : !trendsData?.days.length ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={trendsData.days} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(v as number)} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#4F46E5" fill="url(#gradSales)" strokeWidth={2} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="#10B981" fill="url(#gradCollected)" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Operator performance ── */}
      <div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <h2 className="font-semibold text-sm">Operator Performance</h2>
          <div className="flex gap-1.5 ml-auto">
            {(['all', 'CASH', 'CREDIT'] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={(!operatorFilter && f === 'all') || operatorFilter === f ? 'default' : 'outline'}
                className="h-7 text-xs px-3"
                onClick={() => setOperatorFilter(f === 'all' ? undefined : f as OperatorType)}
              >
                {f === 'all' ? 'All' : f === 'CASH' ? (
                  <><Banknote className="h-3 w-3 mr-1" />Cash</>
                ) : (
                  <><CreditCard className="h-3 w-3 mr-1" />Credit</>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pie chart */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Sales Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {loadingOps ? (
                <Skeleton className="h-48" />
              ) : pieData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No sales today</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine
                    >
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v as number)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Bar chart */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Bills &amp; Receipts by Operator</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {loadingOps ? (
                <Skeleton className="h-48" />
              ) : barData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data today</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Bills" fill="#4F46E5" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Receipts" fill="#10B981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Operator table ── */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />Operator Activity — Today
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingOps ? (
            <div className="p-4"><Skeleton className="h-32" /></div>
          ) : !opData?.operators.length ? (
            <p className="text-center text-muted-foreground text-sm py-8">No operators found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left p-3 font-medium text-xs text-muted-foreground">Operator</th>
                    <th className="text-left p-3 font-medium text-xs text-muted-foreground">Type</th>
                    <th className="text-right p-3 font-medium text-xs text-muted-foreground">Bills</th>
                    <th className="text-right p-3 font-medium text-xs text-muted-foreground">Receipts</th>
                    <th className="text-right p-3 font-medium text-xs text-muted-foreground">Sales</th>
                    <th className="text-right p-3 font-medium text-xs text-muted-foreground">Collected</th>
                    <th className="text-right p-3 font-medium text-xs text-muted-foreground">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {opData.operators.map((op: OperatorStat) => {
                    const pending = op.salesToday - op.collectedToday;
                    return (
                      <tr key={op.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="p-3 font-medium">{op.username}</td>
                        <td className="p-3">
                          {op.operatorType ? (
                            <Badge variant={op.operatorType === 'CASH' ? 'success' : 'warning'} className="text-xs">
                              {op.operatorType}
                            </Badge>
                          ) : '—'}
                        </td>
                        <td className="p-3 text-right">{op.ordersToday}</td>
                        <td className="p-3 text-right">{op.receiptsToday}</td>
                        <td className="p-3 text-right font-medium text-primary">{formatCurrency(op.salesToday)}</td>
                        <td className="p-3 text-right font-medium text-emerald-600">{formatCurrency(op.collectedToday)}</td>
                        <td className={`p-3 text-right font-medium ${pending > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
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

      {/* ── Top products + Recent activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products this month */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PackageSearch className="h-4 w-4" />Top Products — This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingProducts ? (
              <div className="p-4"><Skeleton className="h-48" /></div>
            ) : !topProductsData?.products.length ? (
              <p className="text-center text-muted-foreground text-sm py-8">No sales this month</p>
            ) : (
              <div className="divide-y">
                {topProductsData.products.map((p, idx) => (
                  <div key={p.productId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20">
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.modelName}</p>
                      <p className="text-xs text-muted-foreground">{p.brandName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-primary">{formatCurrency(p.totalRevenue)}</p>
                      <p className="text-xs text-muted-foreground">{p.totalQty} units</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent system activity */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingActivity ? (
              <div className="p-4"><Skeleton className="h-48" /></div>
            ) : !activityData?.logs.length ? (
              <p className="text-center text-muted-foreground text-sm py-8">No recent activity</p>
            ) : (
              <div className="divide-y max-h-[340px] overflow-y-auto">
                {activityData.logs.map((log: ActivityLog) => (
                  <div key={log.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/20">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-tight">
                        <span className="font-medium">{log.user.username}</span>
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
                          className="text-[10px] h-3.5 px-1 mt-0.5"
                        >
                          {log.user.operatorType}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{timeAgo(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
