import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Filter, ImageOff, Edit2, Save, X, BarChart3,
  Package, Tag, Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { stockReportService } from '@/services/stockReportService';
import { brandService } from '@/services/brandService';
import { categoryService } from '@/services/categoryService';
import { productService } from '@/services/productService';
import { usePagination } from '@/hooks/usePagination';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Product, Brand, Category } from '@/types';

const GROUP_BY_OPTIONS = [
  { value: 'brand', label: 'Brand Wise' },
  { value: 'category', label: 'Sub Category Wise' },
  { value: 'quantity', label: 'Quantity Wise' },
];

// ── Mobile product card ────────────────────────────────────────────────────────
function ProductCard({
  product,
  isAdmin,
  editingId,
  editQty,
  setEditQty,
  onEdit,
  onSave,
  onCancel,
  isPending,
}: {
  product: Product;
  isAdmin: boolean;
  editingId: string | null;
  editQty: number;
  setEditQty: (q: number) => void;
  onEdit: (p: Product) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const isEditing = editingId === product.id;
  const stockLow = product.availableQty < 5;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Image */}
        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.modelName}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <ImageOff className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-tight line-clamp-2">{product.modelName}</p>
            <Badge variant={stockLow ? 'warning' : 'success'} className="shrink-0 text-xs">
              {product.availableQty}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {product.brand?.name && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Tag className="h-3 w-3" /> {product.brand.name}
              </span>
            )}
            {product.category?.name && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Layers className="h-3 w-3" /> {product.category.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price strip */}
      <div className="grid grid-cols-3 divide-x border-t bg-muted/30">
        <div className="px-3 py-2 text-center">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-semibold">MRP</p>
          <p className="text-xs font-semibold tabular-nums mt-0.5">{formatCurrency(product.mrp)}</p>
        </div>
        <div className="px-3 py-2 text-center">
          <p className="text-[9px] text-amber-600 uppercase tracking-wide font-semibold">Gold</p>
          <p className="text-xs font-bold text-amber-700 tabular-nums mt-0.5">{formatCurrency(product.cashPrice)}</p>
        </div>
        <div className="px-3 py-2 text-center">
          <p className="text-[9px] text-blue-600 uppercase tracking-wide font-semibold">Platinum</p>
          <p className="text-xs font-bold text-blue-700 tabular-nums mt-0.5">{formatCurrency(product.creditPrice)}</p>
        </div>
      </div>

      {/* Admin edit strip */}
      {isAdmin && (
        <div className="px-3 py-2.5 border-t bg-card flex items-center gap-2">
          <p className="text-xs text-muted-foreground flex-1">
            Stock: <span className="font-semibold text-foreground">{product.availableQty} units</span>
          </p>
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={editQty}
                onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                className="w-20 h-8 text-sm"
                min={0}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-green-600 hover:bg-green-50"
                onClick={() => onSave(product.id)}
                disabled={isPending}
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:bg-red-50"
                onClick={onCancel}
                disabled={isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={() => onEdit(product)}
            >
              <Edit2 className="h-3 w-3" /> Edit Stock
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function StockReportPage() {
  const { page, pageSize, setPage, setPageSize, reset } = usePagination();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [groupBy, setGroupBy] = useState('brand');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);

  const isAdmin = user?.role === 'ADMIN';

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

  const updateStockMutation = useMutation({
    mutationFn: ({ id, availableQty }: { id: string; availableQty: number }) =>
      productService.update(id, { availableQty }),
    onSuccess: () => {
      toast.success('Stock updated successfully');
      queryClient.invalidateQueries({ queryKey: ['stock-reports'] });
      setEditingId(null);
    },
    onError: () => {
      toast.error('Failed to update stock');
    },
  });

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setEditQty(product.availableQty);
  };

  const handleSaveClick = (id: string) => {
    if (editQty < 0) {
      toast.error('Quantity cannot be negative');
      return;
    }
    updateStockMutation.mutate({ id, availableQty: editQty });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditQty(0);
  };

  const activeFiltersCount = (brandId ? 1 : 0) + (categoryId ? 1 : 0) + (groupBy !== 'brand' ? 1 : 0);
  const products: Product[] = (data?.data ?? []) as Product[];

  // ── Desktop table columns ──────────────────────────────────────────────────
  const columns: ColumnDef<Product>[] = [
    {
      key: 'imageUrl',
      header: 'Image',
      cell: (r) => (
        <div className="flex items-center justify-center">
          {r.imageUrl ? (
            <img
              src={r.imageUrl}
              alt={r.modelName}
              className="h-11 w-11 object-cover rounded-lg flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div
              className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"
              aria-label="No image"
            >
              <ImageOff className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'modelName',
      header: 'Model Name',
      cell: (r) => <div className="font-semibold text-sm">{r.modelName}</div>,
    },
    {
      key: 'brand',
      header: 'Brand',
      cell: (r) => <div className="text-sm text-muted-foreground">{r.brand?.name || '—'}</div>,
    },
    {
      key: 'category',
      header: 'Category',
      cell: (r) => <div className="text-sm text-muted-foreground">{r.category?.name || '—'}</div>,
    },
    {
      key: 'mrp',
      header: 'MRP',
      cell: (r) => <div className="text-sm font-medium tabular-nums">{formatCurrency(r.mrp)}</div>,
    },
    {
      key: 'cashPrice',
      header: 'Gold Price',
      cell: (r) => <div className="text-sm font-semibold text-amber-600 tabular-nums">{formatCurrency(r.cashPrice)}</div>,
    },
    {
      key: 'creditPrice',
      header: 'Platinum Price',
      cell: (r) => <div className="text-sm font-semibold text-blue-600 tabular-nums">{formatCurrency(r.creditPrice)}</div>,
    },
    {
      key: 'availableQty',
      header: 'Stock',
      cell: (r) => {
        const isEditing = editingId === r.id;
        if (isEditing) {
          return (
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={editQty}
                onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                className="w-20 h-8"
                min={0}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSaveClick(r.id)}
                disabled={updateStockMutation.isPending}
                className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                disabled={updateStockMutation.isPending}
                className="h-8 w-8 p-0 text-destructive hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <Badge variant={r.availableQty < 5 ? 'warning' : 'success'} className="tabular-nums font-bold">
              {r.availableQty}
            </Badge>
            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEditClick(r)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="Edit stock"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // ── Shared filter controls ─────────────────────────────────────────────────
  const FilterControls = () => (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold mb-1.5 block">Group By</Label>
        <Select value={groupBy} onValueChange={(v) => { setGroupBy(v); reset(); }}>
          <SelectTrigger className="w-full h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {GROUP_BY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-semibold mb-1.5 block">Brand</Label>
        <Select
          value={brandId || '_all'}
          onValueChange={(v) => { setBrandId(v === '_all' ? '' : v); setCategoryId(''); reset(); }}
        >
          <SelectTrigger className="w-full h-9"><SelectValue placeholder="All Brands" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Brands</SelectItem>
            {brands?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-semibold mb-1.5 block">Category</Label>
        <Select
          value={categoryId || '_all'}
          onValueChange={(v) => { setCategoryId(v === '_all' ? '' : v); reset(); }}
          disabled={!brandId}
        >
          <SelectTrigger className="w-full h-9"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Categories</SelectItem>
            {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl px-5 py-4 sm:px-6 sm:py-5 border bg-card shadow-sm">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/5" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-0.5">Inventory</p>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">Stock Report</h1>
            <p className="text-xs text-muted-foreground mt-0.5">View and manage product inventory</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 shrink-0">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">
              {data?.total ?? 0} products
            </span>
          </div>
        </div>
      </div>

      {/* ── Desktop filter bar ──────────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <div className="rounded-xl border bg-card shadow-sm p-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 min-w-[160px]">
              <Label className="text-xs font-semibold mb-1.5 block text-muted-foreground uppercase tracking-wide">Group By</Label>
              <Select value={groupBy} onValueChange={(v) => { setGroupBy(v); reset(); }}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GROUP_BY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <Label className="text-xs font-semibold mb-1.5 block text-muted-foreground uppercase tracking-wide">Brand</Label>
              <Select value={brandId || '_all'} onValueChange={(v) => { setBrandId(v === '_all' ? '' : v); setCategoryId(''); reset(); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Brands" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Brands</SelectItem>
                  {brands?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <Label className="text-xs font-semibold mb-1.5 block text-muted-foreground uppercase tracking-wide">Category</Label>
              <Select value={categoryId || '_all'} onValueChange={(v) => { setCategoryId(v === '_all' ? '' : v); reset(); }} disabled={!brandId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Categories</SelectItem>
                  {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-muted-foreground shrink-0"
                onClick={() => { setBrandId(''); setCategoryId(''); setGroupBy('brand'); reset(); }}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter button ────────────────────────────────────────────── */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full h-10 gap-2 font-medium shadow-sm">
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[300px]">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filters
              </SheetTitle>
            </SheetHeader>
            <FilterControls />
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => { setBrandId(''); setCategoryId(''); setGroupBy('brand'); reset(); }}
              >
                <X className="h-3.5 w-3.5 mr-1.5" /> Clear All Filters
              </Button>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Active filter chips ─────────────────────────────────────────────── */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-1.5 lg:hidden">
          {groupBy !== 'brand' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <Package className="h-3 w-3" />
              {GROUP_BY_OPTIONS.find(o => o.value === groupBy)?.label}
            </span>
          )}
          {brandId && brands && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
              <Tag className="h-3 w-3" />
              {brands.find(b => b.id === brandId)?.name}
            </span>
          )}
          {categoryId && categories && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
              <Layers className="h-3 w-3" />
              {categories.find(c => c.id === categoryId)?.name}
            </span>
          )}
        </div>
      )}

      {/* ── Mobile card list ────────────────────────────────────────────────── */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Package className="h-12 w-12 opacity-20" />
            <p className="text-sm font-medium">No products found</p>
            <p className="text-xs opacity-70">Try adjusting your filters</p>
          </div>
        ) : (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isAdmin={isAdmin}
              editingId={editingId}
              editQty={editQty}
              setEditQty={setEditQty}
              onEdit={handleEditClick}
              onSave={handleSaveClick}
              onCancel={handleCancelEdit}
              isPending={updateStockMutation.isPending}
            />
          ))
        )}
      </div>

      {/* ── Desktop table ───────────────────────────────────────────────────── */}
      <div className="hidden lg:block rounded-xl border bg-card shadow-sm overflow-hidden">
        <DataTable
          columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
          data={(data?.data || []) as Record<string, unknown>[]}
          isLoading={isLoading}
          getRowKey={(r) => (r as unknown as Product).id}
        />
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {data && data.total > 0 && (
        <div className="mt-2">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={data.total}
            totalPages={data.totalPages}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}
