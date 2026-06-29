import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, CreditCard, Banknote, DollarSign, FileSpreadsheet, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboardService } from '@/services/dashboardService';
import { formatCurrency, formatCurrencyForPdf } from '@/utils/formatCurrency';
import { ReportPageHeader } from '@/components/reports/ReportPageHeader';
import { ReportResponsiveFilters, countReportFilters } from '@/components/reports/ReportResponsiveFilters';
import { ReportKpiCard } from '@/components/reports/ReportKpiCard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { exportToExcel, exportToPdf } from '@/utils/exportUtils';
import { toast } from 'sonner';

const COLORS = ['#4F46E5', '#10B981'];

export default function CashCreditReport() {
  const [filter, setFilter] = useState<'today' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const activeCount = countReportFilters(
    filter !== 'today' ? filter : undefined,
    filter === 'custom' ? startDate : undefined,
    filter === 'custom' ? endDate : undefined,
  );

  const { data, isLoading } = useQuery({
    queryKey: ['cash-credit-report', filter, startDate, endDate],
    queryFn: () => dashboardService.getCashCreditReport({
      filter: filter === 'custom' ? undefined : filter,
      startDate: filter === 'custom' ? startDate : undefined,
      endDate: filter === 'custom' ? endDate : undefined,
    }),
    enabled: filter !== 'custom' || (!!startDate && !!endDate),
    refetchInterval: 60000,
    staleTime: 0,
  });

  const handleReset = () => {
    setFilter('today');
    setStartDate('');
    setEndDate('');
  };

  const pieData = data ? [
    { name: 'Gold', value: data.cashSales.amount },
    { name: 'Platinum', value: data.creditSales.amount },
  ].filter((d) => d.value > 0) : [];

  const barData = data ? [
    { type: 'Gold', Sales: data.cashSales.amount, Orders: data.cashSales.orders },
    { type: 'Platinum', Sales: data.creditSales.amount, Orders: data.creditSales.orders },
    { type: 'Total', Sales: data.totalSales.amount, Orders: data.totalSales.orders },
  ] : [];

  const filterFields = (
    <>
      <div className="grid grid-cols-3 gap-2">
        {(['today', 'month', 'custom'] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            className="h-10 text-xs sm:text-sm"
            onClick={() => setFilter(f)}
          >
            {f === 'today' ? 'Today' : f === 'month' ? 'This Month' : 'Custom'}
          </Button>
        ))}
      </div>
      {filter === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cc-start" className="text-xs font-medium">Start Date</Label>
            <Input id="cc-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cc-end" className="text-xs font-medium">End Date</Label>
            <Input id="cc-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10" />
          </div>
        </div>
      )}
    </>
  );

  const handleExportExcel = () => {
    if (!data) return;
    const rows = [
      { type: 'Gold', sales: formatCurrency(data.cashSales.amount), orders: data.cashSales.orders, percentage: `${data.cashSales.percentage.toFixed(1)}%` },
      { type: 'Platinum', sales: formatCurrency(data.creditSales.amount), orders: data.creditSales.orders, percentage: `${data.creditSales.percentage.toFixed(1)}%` },
      { type: 'Total', sales: formatCurrency(data.totalSales.amount), orders: data.totalSales.orders, percentage: '100%' },
    ] as unknown as Record<string, unknown>[];
    exportToExcel(rows, [
      { header: 'Type', accessor: 'type', width: 14 },
      { header: 'Sales Amount', accessor: 'sales', width: 18 },
      { header: 'Orders', accessor: 'orders', width: 12 },
      { header: 'Percentage', accessor: 'percentage', width: 14 },
    ], `Gold_Platinum_Sales_${new Date().toISOString().slice(0, 10)}`);
    toast.success('Excel downloaded');
  };

  const handleExportPdf = () => {
    if (!data) return;
    const rows = [
      { type: 'Gold', sales: formatCurrencyForPdf(data.cashSales.amount), orders: String(data.cashSales.orders), percentage: `${data.cashSales.percentage.toFixed(1)}%` },
      { type: 'Platinum', sales: formatCurrencyForPdf(data.creditSales.amount), orders: String(data.creditSales.orders), percentage: `${data.creditSales.percentage.toFixed(1)}%` },
      { type: 'Total', sales: formatCurrencyForPdf(data.totalSales.amount), orders: String(data.totalSales.orders), percentage: '100%' },
    ] as unknown as Record<string, unknown>[];
    exportToPdf(rows, [
      { header: 'Type', accessor: 'type', width: 14 },
      { header: 'Sales Amount', accessor: 'sales', width: 18 },
      { header: 'Orders', accessor: 'orders', width: 12 },
      { header: 'Percentage', accessor: 'percentage', width: 14 },
    ], {
      title: 'Gold & Platinum Sales Report',
      subtitle: filter === 'custom' ? `${startDate} to ${endDate}` : filter === 'month' ? 'This Month' : 'Today',
      filename: `Gold_Platinum_Sales_${new Date().toISOString().slice(0, 10)}`,
    });
    toast.success('PDF downloaded');
  };

  return (
    <div className="space-y-4 pb-6">
      <ReportPageHeader
        title="Gold and Platinum"
        description="Gold sales, platinum sales, and overall totals"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!data} className="gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={!data} className="gap-1.5">
              <FileDown className="h-3.5 w-3.5" /> PDF
            </Button>
          </div>
        }
      />

      <ReportResponsiveFilters activeCount={activeCount} onReset={handleReset}>
        {filterFields}
      </ReportResponsiveFilters>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 sm:h-28" />)
        ) : (
          <>
            <ReportKpiCard
              label="Gold Sales"
              value={formatCurrency(data?.cashSales.amount ?? 0)}
              amount={data?.cashSales.amount ?? 0}
              sub={`${data?.cashSales.orders ?? 0} orders · ${(data?.cashSales.percentage ?? 0).toFixed(1)}%`}
              icon={Banknote}
              iconClassName="bg-blue-500/10 text-blue-600 ring-blue-500/20"
            />
            <ReportKpiCard
              label="Platinum Sales"
              value={formatCurrency(data?.creditSales.amount ?? 0)}
              amount={data?.creditSales.amount ?? 0}
              sub={`${data?.creditSales.orders ?? 0} orders · ${(data?.creditSales.percentage ?? 0).toFixed(1)}%`}
              icon={CreditCard}
              iconClassName="bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
            />
            <ReportKpiCard
              label="Total Sales"
              value={formatCurrency(data?.totalSales.amount ?? 0)}
              amount={data?.totalSales.amount ?? 0}
              sub={`${data?.totalSales.orders ?? 0} orders`}
              icon={TrendingUp}
              iconClassName="bg-indigo-500/10 text-indigo-600 ring-indigo-500/20"
            />
            <ReportKpiCard
              label="Avg Order"
              value={formatCurrency(
                data && data.totalSales.orders > 0
                  ? data.totalSales.amount / data.totalSales.orders
                  : 0
              )}
              amount={data && data.totalSales.orders > 0 ? data.totalSales.amount / data.totalSales.orders : 0}
              sub="Per transaction"
              icon={DollarSign}
              iconClassName="bg-purple-500/10 text-purple-600 ring-purple-500/20"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardTitle className="text-sm">Sales Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-52 sm:h-64" />
            ) : pieData.length === 0 ? (
              <div className="h-52 sm:h-64 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardTitle className="text-sm">Sales Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-52 sm:h-64" />
            ) : !data ? (
              <div className="h-52 sm:h-64 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v, name) => (name === 'Sales' ? formatCurrency(v as number) : v)} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Sales" fill="#4F46E5" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Orders" fill="#10B981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
