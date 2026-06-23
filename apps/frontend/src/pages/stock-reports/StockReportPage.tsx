import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet, Printer, Filter, ImageOff } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { stockReportService } from '@/services/stockReportService';
import { brandService } from '@/services/brandService';
import { categoryService } from '@/services/categoryService';
import { usePagination } from '@/hooks/usePagination';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Product, Brand, Category } from '@/types';

const GROUP_BY_OPTIONS = [
  { value: 'brand', label: 'Brand Wise' },
  { value: 'category', label: 'Sub Category Wise' },
  { value: 'quantity', label: 'Quantity Wise' },
];

export default function StockReportPage() {
  const { page, pageSize, setPage, setPageSize, reset } = usePagination();
  const [groupBy, setGroupBy] = useState('brand');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const { data: brands } = useQuery<Brand[]>({
    queryKey: ['brands-all'],
    queryFn: () => brandService.getAll(),
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories-by-brand', brandId],
    queryFn: () => categoryService.getByBrand(brandId),
    enabled: !!brandId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['stock-reports', page, pageSize, groupBy, brandId, categoryId],
    queryFn: () =>
      stockReportService.getReport({
        page,
        pageSize,
        groupBy,
        brandId: brandId || undefined,
        categoryId: categoryId || undefined,
      }),
  });

  const exportParams = {
    groupBy,
    brandId: brandId || undefined,
    categoryId: categoryId || undefined,
  };

  const handleExportPdf = async () => {
    try {
      await stockReportService.exportPdf(exportParams);
    } catch {
      toast.error('PDF export failed');
    }
  };

  const handleExportExcel = async () => {
    try {
      await stockReportService.exportExcel(exportParams);
    } catch {
      toast.error('Excel export failed');
    }
  };

  const columns: ColumnDef<Product>[] = [
    {
      key: 'imageUrl',
      header: 'Product',
      cell: (r) => (
        <div className="flex items-center justify-center">
          {r.imageUrl ? (
            <img
              src={r.imageUrl}
              alt={r.modelName}
              className="h-10 w-10 object-cover rounded flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div
              className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0"
              title="No image"
              aria-label="No image"
            >
              <ImageOff className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      ),
    },
    { key: 'modelName', header: 'Model Name' },
    {
      key: 'brand',
      header: 'Brand',
      cell: (r) => r.brand?.name || '-',
    },
    {
      key: 'category',
      header: 'Category',
      cell: (r) => r.category?.name || '-',
    },
    {
      key: 'mrp',
      header: 'MRP',
      cell: (r) => formatCurrency(r.mrp),
    },
    {
      key: 'nlc',
      header: 'NLC (Selling Price)',
      cell: (r) => formatCurrency(r.nlc),
    },
    {
      key: 'availableQty',
      header: 'Available Qty',
      cell: (r) => (
        <Badge variant={r.availableQty < 5 ? 'warning' : 'success'}>
          {r.availableQty}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Report"
        description="View inventory across multiple dimensions"
        actions={
          <div className="hidden sm:flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPdf}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          </div>
        }
      />

      {/* Mobile Filters - Sheet/Drawer */}
      <div className="mb-3 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Filters & Export
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter & Export</SheetTitle>
            </SheetHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-1.5 block font-medium">Group By</Label>
                <Select
                  value={groupBy}
                  onValueChange={(v) => {
                    setGroupBy(v);
                    reset();
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_BY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block font-medium">Brand</Label>
                <Select
                  value={brandId || '_all'}
                  onValueChange={(v) => {
                    setBrandId(v === '_all' ? '' : v);
                    setCategoryId('');
                    reset();
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All Brands</SelectItem>
                    {brands?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block font-medium">Category</Label>
                <Select
                  value={categoryId || '_all'}
                  onValueChange={(v) => {
                    setCategoryId(v === '_all' ? '' : v);
                    reset();
                  }}
                  disabled={!brandId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All Categories</SelectItem>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 space-y-2">
                <Button variant="outline" size="sm" onClick={handleExportPdf} className="w-full">
                  <Download className="h-4 w-4 mr-1" /> Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportExcel} className="w-full">
                  <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filters - Inline */}
      <Card className="mb-3 hidden lg:block">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3">
            <div>
              <Label className="text-xs mb-1.5 block font-medium">Group By</Label>
              <Select
                value={groupBy}
                onValueChange={(v) => {
                  setGroupBy(v);
                  reset();
                }}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_BY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block font-medium">Brand</Label>
              <Select
                value={brandId || '_all'}
                onValueChange={(v) => {
                  setBrandId(v === '_all' ? '' : v);
                  setCategoryId('');
                  reset();
                }}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Brands</SelectItem>
                  {brands?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block font-medium">Category</Label>
              <Select
                value={categoryId || '_all'}
                onValueChange={(v) => {
                  setCategoryId(v === '_all' ? '' : v);
                  reset();
                }}
                disabled={!brandId}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Categories</SelectItem>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
        data={(data?.data || []) as Record<string, unknown>[]}
        isLoading={isLoading}
        getRowKey={(r) => (r as unknown as Product).id}
      />
      {data && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}

