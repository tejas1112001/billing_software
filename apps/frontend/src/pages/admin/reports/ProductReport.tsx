import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Package, TrendingUp, DollarSign, Boxes, History, FileSpreadsheet, FileDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { dashboardService } from '@/services/dashboardService';
import { formatCurrency, formatCurrencyForPdf } from '@/utils/formatCurrency';
import { formatDateTime } from '@/utils/formatDate';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { exportToExcel, exportToPdf } from '@/utils/exportUtils';
import { toast } from 'sonner';

type ProductReportItem = {
  productId: string;
  productName: string;
  brandName: string;
  categoryName: string;
  purchasePrice: number | null;
  cashPrice: number;
  creditPrice: number;
  mrp: number;
  totalQuantityAdded: number;
  totalQuantitySold: number;
  currentRemainingStock: number;
  totalSalesAmount: number;
  totalProfit: number;
};

type StockHistoryEntry = {
  id: string;
  date: string;
  type: string;
  delta?: number;
  performedBy?: string;
  note: string;
};

function StockHistoryDialog({
  productId,
  productName,
  open,
  onClose,
}: {
  productId: string;
  productName: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery<StockHistoryEntry[]>({
    queryKey: ['product-stock-history', productId],
    queryFn: () => dashboardService.getProductStockHistory(productId),
    enabled: open && !!productId,
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">Stock History: {productName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3 -mx-2 px-2 py-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading stock history...</p>
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No stock adjustments found.</p>
          ) : (
            data.map((entry) => (
              <div key={entry.id} className="border-b pb-2 last:border-b-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-normal">{entry.note}</p>
                  {entry.delta !== undefined && (
                    <Badge
                      variant={entry.delta >= 0 ? 'success' : 'destructive'}
                      className="shrink-0 text-[10px]"
                    >
                      {entry.delta >= 0 ? '+' : ''}{entry.delta}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{formatDateTime(entry.date)}</span>
                  {entry.performedBy && <span>By {entry.performedBy}</span>}
                  <span className="capitalize">{entry.type.replace('_', ' ')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProductReport() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [productId, setProductId] = useState('');
  const [page, setPage] = useState(1);
  const [historyProduct, setHistoryProduct] = useState<{ id: string; name: string } | null>(null);
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
    queryKey: ['product-report', startDate, endDate, brandId, categoryId, storeId, productId, page],
    queryFn: () => dashboardService.getProductReport({
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

  const items: ProductReportItem[] = data?.items ?? [];

  const fetchAllForExport = async () => {
    setIsExporting(true);
    try {
      const res = await dashboardService.getProductReport({
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
    { header: 'Category', accessor: 'categoryName', width: 18 },
    { header: 'MRP', accessor: (r: Record<string, unknown>) => formatCurrencyForPdf(r.mrp as number), width: 14 },
    { header: 'Gold Price', accessor: (r: Record<string, unknown>) => formatCurrencyForPdf(r.cashPrice as number), width: 14 },
    { header: 'Platinum Price', accessor: (r: Record<string, unknown>) => formatCurrencyForPdf(r.creditPrice as number), width: 14 },
    { header: 'Qty Added', accessor: 'totalQuantityAdded', width: 12 },
    { header: 'Qty Sold', accessor: 'totalQuantitySold', width: 12 },
    { header: 'Stock Left', accessor: 'currentRemainingStock', width: 12 },
    { header: 'Revenue', accessor: (r: Record<string, unknown>) => formatCurrencyForPdf(r.totalSalesAmount as number), width: 16 },
    { header: 'Profit', accessor: (r: Record<string, unknown>) => formatCurrencyForPdf(r.totalProfit as number), width: 16 },
  ];

  const handleExportExcel = async () => {
    try {
      const rows = await fetchAllForExport();
      const dateTag = startDate && endDate ? `${startDate}_to_${endDate}` : new Date().toISOString().slice(0, 10);
      exportToExcel(rows, exportColumns, `Product_Report_${dateTag}`);
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
        title: 'Product Stock & Sales Report',
        subtitle: `Period: ${dateTag}  |  Total Products: ${rows.length}`,
        filename: `Product_Report_${new Date().toISOString().slice(0, 10)}`,
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
        title="Product Report"
        description="Complete product history — stock, sales, pricing, and profit"
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
              label="Total Added"
              value={data?.summary.totalQuantityAdded ?? 0}
              sub="Units received"
              icon={Boxes}
              iconClassName="bg-blue-500/10 text-blue-600 ring-blue-500/20"
            />
            <ReportKpiCard
              label="Total Sold"
              value={data?.summary.totalQuantitySold ?? 0}
              sub="Units sold"
              icon={Package}
              iconClassName="bg-orange-500/10 text-orange-600 ring-orange-500/20"
            />
            <ReportKpiCard
              label="Remaining Stock"
              value={data?.summary.currentRemainingStock ?? 0}
              sub="Current inventory"
              icon={Boxes}
              iconClassName="bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
              valueClassName="text-emerald-600"
            />
            <ReportKpiCard
              label="Total Sales"
              value={formatCurrency(data?.summary.totalSalesAmount ?? 0)}
              amount={data?.summary.totalSalesAmount ?? 0}
              icon={DollarSign}
              iconClassName="bg-indigo-500/10 text-indigo-600 ring-indigo-500/20"
            />
            <ReportKpiCard
              label="Total Profit"
              value={formatCurrency(data?.summary.totalProfit ?? 0)}
              amount={data?.summary.totalProfit ?? 0}
              icon={TrendingUp}
              iconClassName="bg-purple-500/10 text-purple-600 ring-purple-500/20"
              valueClassName="text-emerald-600"
            />
          </>
        )}
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="p-3 sm:p-4 pb-2 border-b bg-muted/20">
          <CardTitle className="text-sm">Product History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><Skeleton className="h-64" /></div>
          ) : !items.length ? (
            <p className="text-center text-muted-foreground text-sm py-12 px-4">No data for selected filters</p>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden divide-y">
                {items.map((item, idx) => (
                  <div key={item.productId} className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{item.productName}</p>
                        <p className="text-[10px] text-muted-foreground">{item.brandName} · {item.categoryName}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        Stock: {item.currentRemainingStock}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div><span className="text-muted-foreground">Added:</span> {item.totalQuantityAdded}</div>
                      <div><span className="text-muted-foreground">Sold:</span> {item.totalQuantitySold}</div>
                      <div><span className="text-muted-foreground">Purchase:</span> {item.purchasePrice != null ? formatCurrency(item.purchasePrice) : '—'}</div>
                      <div><span className="text-muted-foreground">Gold/Platinum:</span> {formatCurrency(item.cashPrice)} / {formatCurrency(item.creditPrice)}</div>
                      <div><span className="text-muted-foreground">Sales:</span> <span className="font-medium text-blue-600">{formatCurrency(item.totalSalesAmount)}</span></div>
                      <div><span className="text-muted-foreground">Profit:</span> <span className="font-medium text-emerald-600">{formatCurrency(item.totalProfit)}</span></div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs"
                      onClick={() => setHistoryProduct({ id: item.productId, name: item.productName })}
                    >
                      <History className="h-3 w-3 mr-1" /> View Stock History
                    </Button>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs sm:text-sm min-w-[720px]">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left p-2.5 font-medium text-muted-foreground w-8">#</th>
                      <th className="text-left p-2.5 font-medium text-muted-foreground">Product</th>
                      <th className="text-right p-2.5 font-medium text-muted-foreground">Added</th>
                      <th className="text-right p-2.5 font-medium text-muted-foreground">Sold</th>
                      <th className="text-right p-2.5 font-medium text-muted-foreground">Stock</th>
                      <th className="text-right p-2.5 font-medium text-muted-foreground hidden lg:table-cell">Purchase</th>
                      <th className="text-right p-2.5 font-medium text-muted-foreground hidden lg:table-cell">Gold/Platinum</th>
                      <th className="text-right p-2.5 font-medium text-muted-foreground">Sales</th>
                      <th className="text-right p-2.5 font-medium text-muted-foreground">Profit</th>
                      <th className="text-center p-2.5 font-medium text-muted-foreground w-20">History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                          <tr key={item.productId} className="border-b hover:bg-muted/20">
                            <td className="p-2.5 text-muted-foreground">{(page - 1) * limit + idx + 1}</td>
                            <td className="p-2.5 font-medium">
                              <div className="truncate max-w-[160px]">{item.productName}</div>
                              <div className="text-[10px] text-muted-foreground">{item.brandName}</div>
                            </td>
                            <td className="p-2.5 text-right tabular-nums">{item.totalQuantityAdded}</td>
                            <td className="p-2.5 text-right tabular-nums">{item.totalQuantitySold}</td>
                            <td className="p-2.5 text-right">
                              <Badge variant={item.currentRemainingStock < 5 ? 'warning' : 'success'} className="text-[10px]">
                                {item.currentRemainingStock}
                              </Badge>
                            </td>
                            <td className="p-2.5 text-right hidden lg:table-cell tabular-nums">
                              {item.purchasePrice != null ? formatCurrency(item.purchasePrice) : '—'}
                            </td>
                            <td className="p-2.5 text-right hidden lg:table-cell text-[10px] tabular-nums">
                              {formatCurrency(item.cashPrice)} / {formatCurrency(item.creditPrice)}
                            </td>
                            <td className="p-2.5 text-right font-medium text-blue-600 tabular-nums">
                              {formatCurrency(item.totalSalesAmount)}
                            </td>
                            <td className="p-2.5 text-right font-semibold text-emerald-600 tabular-nums">
                              {formatCurrency(item.totalProfit)}
                            </td>
                            <td className="p-2.5 text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                title="Stock history"
                                onClick={() => setHistoryProduct({ id: item.productId, name: item.productName })}
                              >
                                <History className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data?.pagination && (
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

      <StockHistoryDialog
        productId={historyProduct?.id ?? ''}
        productName={historyProduct?.name ?? ''}
        open={!!historyProduct}
        onClose={() => setHistoryProduct(null)}
      />
    </div>
  );
}
