import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Percent, Package, FileSpreadsheet, FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardService } from '@/services/dashboardService';
import { formatCurrency, formatCurrencyForPdf } from '@/utils/formatCurrency';
import { brandService } from '@/services/brandService';
import { categoryService } from '@/services/categoryService';
import { storeService } from '@/services/storeService';
import { productService } from '@/services/productService';
import { reportFilterValue } from '@/utils/reportFilters';
import type { Product } from '@/types';
import { ReportPageHeader } from '@/components/reports/ReportPageHeader';
import { ReportResponsiveFilters, countReportFilters } from '@/components/reports/ReportResponsiveFilters';
import { ReportEntityFilterFields } from '@/components/reports/ReportEntityFilterFields';
import { ReportKpiCard } from '@/components/reports/ReportKpiCard';
import { ReportPagination } from '@/components/reports/ReportPagination';
import { cn } from '@/lib/utils';
import { exportToExcel, exportToPdf } from '@/utils/exportUtils';
import { toast } from 'sonner';

export default function ProfitReport() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [productId, setProductId] = useState('');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const limit = 20;

  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: () => brandService.getAll() });
  const { data: categories } = useQuery({
    queryKey: ['categories', brandId],
    queryFn: () => categoryService.getByBrand(reportFilterValue(brandId)!),
    enabled: !!reportFilterValue(brandId),
  });
  const { data: stores } = useQuery({ queryKey: ['stores'], queryFn: () => storeService.getAll() });
  const { data: productsData } = useQuery({
    queryKey: ['products-report', brandId, categoryId],
    queryFn: () => productService.list({
      page: 1,
      pageSize: 500,
      brandId: reportFilterValue(brandId),
      categoryId: reportFilterValue(categoryId),
    }),
  });

  const products: Product[] = productsData?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['profit-report', startDate, endDate, brandId, categoryId, storeId, productId, page],
    queryFn: () => dashboardService.getProfitReport({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      brandId: reportFilterValue(brandId),
      categoryId: reportFilterValue(categoryId),
      storeId: reportFilterValue(storeId),
      productId: reportFilterValue(productId),
      page,
      limit,
    }),
    refetchInterval: 60000,
    staleTime: 0,
  });

  const activeCount = countReportFilters(startDate, endDate, brandId, categoryId, storeId, productId);

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setBrandId('');
    setCategoryId('');
    setStoreId('');
    setProductId('');
    setPage(1);
  };

  const handleBrandChange = (value: string) => {
    setBrandId(value);
    setCategoryId('');
    setProductId('');
    setPage(1);
  };

  const fetchAllForExport = async () => {
    setIsExporting(true);
    try {
      const res = await dashboardService.getProfitReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        brandId: reportFilterValue(brandId),
        categoryId: reportFilterValue(categoryId),
        storeId: reportFilterValue(storeId),
        productId: reportFilterValue(productId),
        page: 1,
        limit: 10000,
      });
      return res.items as Record<string, unknown>[];
    } finally {
      setIsExporting(false);
    }
  };

  const exportColumns = [
    { header: 'Product Name', accessor: 'productName', width: 30 },
    { header: 'Brand', accessor: 'brandName', width: 18 },
    { header: 'Qty', accessor: 'totalQuantity', width: 10 },
    { header: 'Sales', accessor: (r: Record<string, unknown>) => formatCurrencyForPdf(r.totalSales as number), width: 18 },
    { header: 'Cost', accessor: (r: Record<string, unknown>) => formatCurrencyForPdf(r.totalCost as number), width: 18 },
    { header: 'Profit', accessor: (r: Record<string, unknown>) => formatCurrencyForPdf(r.totalProfit as number), width: 18 },
    {
      header: 'Margin %',
      accessor: (r: Record<string, unknown>) => {
        const sales = (r.totalSales as number) || 0;
        const profit = (r.totalProfit as number) || 0;
        return sales > 0 ? `${((profit / sales) * 100).toFixed(1)}%` : '0%';
      },
      width: 14,
    },
  ];

  const handleExportExcel = async () => {
    try {
      const rows = await fetchAllForExport();
      const dateTag = startDate && endDate ? `${startDate}_to_${endDate}` : new Date().toISOString().slice(0, 10);
      exportToExcel(rows, exportColumns, `Profit_Report_${dateTag}`);
      toast.success('Excel downloaded');
    } catch {
      toast.error('Failed to export Excel');
    }
  };

  const handleExportPdf = async () => {
    try {
      const rows = await fetchAllForExport();
      const dateTag = startDate && endDate ? `${startDate} to ${endDate}` : new Date().toLocaleDateString('en-IN');
      exportToPdf(rows, exportColumns, {
        title: 'Profit & Loss Report',
        subtitle: `Period: ${dateTag}  |  Total Products: ${rows.length}`,
        filename: `Profit_Report_${new Date().toISOString().slice(0, 10)}`,
        orientation: 'landscape',
      });
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <ReportPageHeader
        title="Profit Report"
        description="Sales, cost, profit and margin by product"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExporting} className="gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={isExporting} className="gap-1.5">
              <FileDown className="h-3.5 w-3.5" /> PDF
            </Button>
          </div>
        }
      />

      <ReportResponsiveFilters activeCount={activeCount} onReset={handleReset}>
        <ReportEntityFilterFields
          startDate={startDate}
          endDate={endDate}
          brandId={brandId}
          categoryId={categoryId}
          storeId={storeId}
          productId={productId}
          brands={brands}
          categories={categories}
          stores={stores}
          products={products}
          onStartDateChange={(v) => { setStartDate(v); setPage(1); }}
          onEndDateChange={(v) => { setEndDate(v); setPage(1); }}
          onBrandChange={handleBrandChange}
          onCategoryChange={(v) => { setCategoryId(v); setProductId(''); setPage(1); }}
          onStoreChange={(v) => { setStoreId(v); setPage(1); }}
          onProductChange={(v) => { setProductId(v); setPage(1); }}
        />
      </ReportResponsiveFilters>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 sm:h-28" />)
        ) : (
          <>
            <ReportKpiCard
              label="Total Sales"
              value={formatCurrency(data?.summary.totalSales ?? 0)}
              amount={data?.summary.totalSales ?? 0}
              icon={DollarSign}
              iconClassName="bg-blue-500/10 text-blue-600 ring-blue-500/20"
            />
            <ReportKpiCard
              label="Total Cost"
              value={formatCurrency(data?.summary.totalCost ?? 0)}
              amount={data?.summary.totalCost ?? 0}
              icon={DollarSign}
              iconClassName="bg-orange-500/10 text-orange-600 ring-orange-500/20"
            />
            <ReportKpiCard
              label="Total Profit"
              value={formatCurrency(data?.summary.totalProfit ?? 0)}
              amount={data?.summary.totalProfit ?? 0}
              icon={TrendingUp}
              iconClassName="bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
              valueClassName="text-emerald-600"
            />
            <ReportKpiCard
              label="Margin"
              value={`${(data?.summary.profitMargin ?? 0).toFixed(1)}%`}
              icon={Percent}
              iconClassName="bg-indigo-500/10 text-indigo-600 ring-indigo-500/20"
              valueClassName="text-indigo-600"
            />
            <ReportKpiCard
              label="Products"
              value={data?.summary.productCount ?? 0}
              sub="Unique items"
              icon={Package}
              iconClassName="bg-purple-500/10 text-purple-600 ring-purple-500/20"
            />
          </>
        )}
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="p-3 sm:p-4 pb-2 border-b bg-muted/20">
          <CardTitle className="text-sm">Profit Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><Skeleton className="h-64" /></div>
          ) : !data?.items.length ? (
            <p className="text-center text-muted-foreground text-sm py-12 px-4">No data for selected filters</p>
          ) : (
            <>
              <div className="overflow-x-auto -mx-px">
                <table className="w-full text-xs sm:text-sm min-w-[360px]">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left p-2.5 sm:p-3 font-medium text-muted-foreground w-10">#</th>
                      <th className="text-left p-2.5 sm:p-3 font-medium text-muted-foreground">Product</th>
                      <th className="text-right p-2.5 sm:p-3 font-medium text-muted-foreground hidden md:table-cell">Qty</th>
                      <th className="text-right p-2.5 sm:p-3 font-medium text-muted-foreground">Sales</th>
                      <th className="text-right p-2.5 sm:p-3 font-medium text-muted-foreground hidden sm:table-cell">Cost</th>
                      <th className="text-right p-2.5 sm:p-3 font-medium text-muted-foreground">Profit</th>
                      <th className="text-right p-2.5 sm:p-3 font-medium text-muted-foreground hidden lg:table-cell">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item: {
                      productId: string;
                      productName: string;
                      brandName: string;
                      totalQuantity: number;
                      totalSales: number;
                      totalCost: number;
                      totalProfit: number;
                    }, idx: number) => {
                      const margin = item.totalSales > 0
                        ? (item.totalProfit / item.totalSales) * 100
                        : 0;
                      return (
                        <tr key={item.productId} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="p-2.5 sm:p-3 text-muted-foreground">{(page - 1) * limit + idx + 1}</td>
                          <td className="p-2.5 sm:p-3 font-medium">
                            <div className="truncate max-w-[120px] sm:max-w-none">{item.productName}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 sm:hidden">
                              {formatCurrency(item.totalSales)} sales
                            </div>
                          </td>
                          <td className="p-2.5 sm:p-3 text-right hidden md:table-cell">{item.totalQuantity}</td>
                          <td className="p-2.5 sm:p-3 text-right font-medium text-blue-600">
                            {formatCurrency(item.totalSales)}
                          </td>
                          <td className="p-2.5 sm:p-3 text-right font-medium text-orange-600 hidden sm:table-cell">
                            {formatCurrency(item.totalCost)}
                          </td>
                          <td className="p-2.5 sm:p-3 text-right font-semibold text-emerald-600">
                            {formatCurrency(item.totalProfit)}
                          </td>
                          <td className={cn(
                            'p-2.5 sm:p-3 text-right font-medium hidden lg:table-cell',
                            margin >= 20 ? 'text-emerald-600' : margin >= 10 ? 'text-yellow-600' : 'text-red-600'
                          )}>
                            {margin.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {data.pagination && (
                <ReportPagination
                  page={data.pagination.page}
                  pages={data.pagination.pages}
                  total={data.pagination.total}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
