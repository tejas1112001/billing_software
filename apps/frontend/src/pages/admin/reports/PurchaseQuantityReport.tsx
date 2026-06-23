import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardService } from '@/services/dashboardService';
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

export default function PurchaseQuantityReport() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [productId, setProductId] = useState('');
  const [page, setPage] = useState(1);
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
    queryKey: ['purchase-quantity-report', startDate, endDate, brandId, categoryId, storeId, productId, page],
    queryFn: () => dashboardService.getPurchaseQuantityReport({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      brandId: reportFilterValue(brandId),
      categoryId: reportFilterValue(categoryId),
      storeId: reportFilterValue(storeId),
      productId: reportFilterValue(productId),
      page,
      limit,
    }),
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

  return (
    <div className="space-y-4 pb-6">
      <ReportPageHeader
        title="Purchases Qty"
        description="Total quantities sold by product with filters"
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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 sm:h-28" />)
        ) : (
          <>
            <ReportKpiCard
              label="Total Qty"
              value={(data?.summary.totalQuantity ?? 0).toLocaleString()}
              sub="Units sold"
              icon={Package}
              iconClassName="bg-blue-500/10 text-blue-600 ring-blue-500/20"
            />
            <ReportKpiCard
              label="Products"
              value={data?.summary.productCount ?? 0}
              sub="Unique items"
              icon={Package}
              iconClassName="bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
            />
            <ReportKpiCard
              label="Avg Qty"
              value={
                data && data.summary.productCount > 0
                  ? Math.round(data.summary.totalQuantity / data.summary.productCount)
                  : 0
              }
              sub="Per product"
              icon={Package}
              iconClassName="bg-indigo-500/10 text-indigo-600 ring-indigo-500/20"
            />
          </>
        )}
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="p-3 sm:p-4 pb-2 border-b bg-muted/20">
          <CardTitle className="text-sm">Purchase Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><Skeleton className="h-64" /></div>
          ) : !data?.items.length ? (
            <p className="text-center text-muted-foreground text-sm py-12 px-4">No data for selected filters</p>
          ) : (
            <>
              <div className="overflow-x-auto -mx-px">
                <table className="w-full text-xs sm:text-sm min-w-[320px]">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left p-2.5 sm:p-3 font-medium text-muted-foreground w-10">#</th>
                      <th className="text-left p-2.5 sm:p-3 font-medium text-muted-foreground">Product</th>
                      <th className="text-left p-2.5 sm:p-3 font-medium text-muted-foreground hidden sm:table-cell">Brand</th>
                      <th className="text-left p-2.5 sm:p-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                      <th className="text-right p-2.5 sm:p-3 font-medium text-muted-foreground">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item: { productId: string; productName: string; brandName: string; categoryName: string; totalQuantity: number }, idx: number) => (
                      <tr key={item.productId} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="p-2.5 sm:p-3 text-muted-foreground">{(page - 1) * limit + idx + 1}</td>
                        <td className="p-2.5 sm:p-3 font-medium">
                          <div className="truncate max-w-[140px] sm:max-w-none">{item.productName}</div>
                          <div className="sm:hidden text-[10px] text-muted-foreground mt-0.5">{item.brandName}</div>
                        </td>
                        <td className="p-2.5 sm:p-3 hidden sm:table-cell">{item.brandName}</td>
                        <td className="p-2.5 sm:p-3 hidden md:table-cell">{item.categoryName}</td>
                        <td className="p-2.5 sm:p-3 text-right font-semibold text-primary">
                          {item.totalQuantity.toLocaleString()}
                        </td>
                      </tr>
                    ))}
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
