import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Eye, Pencil, Trash2, Printer, Download, ArrowUpDown, Plus, Minus,
  FileSpreadsheet, FileDown, Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';
import { BillPreviewModal } from '@/components/common/BillPreviewModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { orderService } from '@/services/orderService';
import { userService } from '@/services/userService';
import { storeService } from '@/services/storeService';
import { api } from '@/services/api';
import { usePagination } from '@/hooks/usePagination';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatCurrencyForPdf } from '@/utils/formatCurrency';
import { formatDateTime } from '@/utils/formatDate';
import { getOperatorTypeDisplay } from '@/utils/operatorTypeDisplay';
import { getProductDisplayName } from '@/utils/productName';
import { exportToExcel, exportToPdf, ExportColumn } from '@/utils/exportUtils';
import type { Order, OrderItem, PaginatedResponse, AppUser, Store } from '@/types';

function formatBillDate(dateStr: string) {
  return formatDateTime(dateStr);
}

export default function GeneratedBillsPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const { page, pageSize, setPage, setPageSize, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'billNumber'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterStoreId, setFilterStoreId] = useState('');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<Array<{ productId: string; modelName: string; quantity: number; maxQty: number }>>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [discountOrder, setDiscountOrder] = useState<Order | null>(null);
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');

  const { data: usersData } = useQuery({
    queryKey: ['users-for-filter'],
    queryFn: () => userService.list({ pageSize: 100 }),
    enabled: isAdmin,
  });

  const { data: storesData } = useQuery<Store[]>({
    queryKey: ['stores-all'],
    queryFn: () => storeService.getAll(),
    enabled: isAdmin,
  });

  const { data, isLoading } = useQuery<PaginatedResponse<Order>>({
    queryKey: ['generated-bills', page, pageSize, search, sortBy, sortOrder, filterUserId, filterStoreId],
    queryFn: () =>
      orderService.list({
        page,
        pageSize,
        search: search || undefined,
        sortBy,
        sortOrder,
        userId: filterUserId && filterUserId !== '_all' ? filterUserId : undefined,
        storeId: filterStoreId && filterStoreId !== '_all' ? filterStoreId : undefined,
      }),
    refetchInterval: 30000,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => orderService.delete(id),
    onSuccess: () => {
      toast.success('Bill deleted');
      qc.invalidateQueries({ queryKey: ['generated-bills'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      setDeleteId(null);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to delete bill');
    },
  });

  const updateMut = useMutation({
    mutationFn: () =>
      orderService.update(editOrder!.id, {
        items: editItems
          .filter((i) => i.quantity > 0)
          .map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }),
    onSuccess: (order: Order) => {
      toast.success('Bill updated');
      qc.invalidateQueries({ queryKey: ['generated-bills'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      setEditOrder(null);
      setViewOrder(order);
      setPreviewOpen(true);
    },
    onError: (e: unknown) => {
      const response = (e as { response?: { data?: { error?: string; details?: string } } })?.response?.data;
      toast.error((response?.error || 'Failed to update bill') + (response?.details ? ` (${response.details})` : ''));
    },
  });

  const discountMut = useMutation({
    mutationFn: () =>
      orderService.applyDiscount(discountOrder!.id, {
        discountType,
        discountValue: Number(discountValue),
      }),
    onSuccess: (order: Order) => {
      toast.success('Discount applied successfully');
      qc.invalidateQueries({ queryKey: ['generated-bills'] });
      setDiscountOrder(null);
      setDiscountValue('');
      setDiscountType('PERCENTAGE');
      setViewOrder(order);
      setPreviewOpen(true);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to apply discount');
    },
  });

  const openView = async (order: Order) => {
    try {
      const full = await orderService.getById(order.id);
      setViewOrder(full);
      setPreviewOpen(true);
    } catch {
      toast.error('Failed to load bill');
    }
  };

  const openEdit = async (order: Order) => {
    try {
      const full = await orderService.getById(order.id);
      setEditOrder(full);
      setEditItems(
        (full.orderItems ?? []).map((item: OrderItem) => ({
          productId: item.productId,
          modelName: getProductDisplayName(item.product),
          quantity: item.quantity,
          maxQty: (item.product?.availableQty ?? 0) + item.quantity,
        }))
      );
    } catch {
      toast.error('Failed to load bill for editing');
    }
  };

  const handleDownload = (order: Order) => {
    orderService.downloadPdf(order.id, order.billNumber);
  };

  const handleReprint = async (order: Order) => {
    await openView(order);
  };

  const handleShare = async () => {
    if (!viewOrder) return;
    try {
      const response = await api.get(`/orders/${viewOrder.id}/pdf`, { responseType: 'blob' });
      const blob = response.data;
      const file = new File([blob], `bill-${viewOrder.billNumber}.pdf`, { type: 'application/pdf' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `Bill ${viewOrder.billNumber}`, files: [file] });
      } else {
        handleDownload(viewOrder);
      }
    } catch {
      toast.error('Failed to share PDF');
    }
  };

  // ── Export helpers ──────────────────────────────────────────────────────────

  const exportColumns: ExportColumn[] = [
    { header: 'Bill No.', accessor: 'billNumber', width: 16 },
    { header: 'Date', accessor: (r) => formatBillDate(r.createdAt as string), width: 22 },
    { header: 'Store', accessor: (r) => (r.store as { name?: string })?.name ?? '—', width: 20 },
    ...(isAdmin ? [{ header: 'Created By', accessor: (r: Record<string, unknown>) => (r.user as { username?: string })?.username ?? '—', width: 18 } as ExportColumn] : []),
    { header: 'Items', accessor: (r) => String(r.itemCount ?? (r.orderItems as unknown[])?.length ?? 0), width: 10 },
    { header: 'Total Amount', accessor: (r) => formatCurrencyForPdf(r.totalAmount as number), width: 18 },
  ];

  const fetchAllForExport = async () => {
    setIsExporting(true);
    try {
      const res = await orderService.list({
        page: 1,
        pageSize: 10000,
        search: search || undefined,
        sortBy,
        sortOrder,
        userId: filterUserId && filterUserId !== '_all' ? filterUserId : undefined,
        storeId: filterStoreId && filterStoreId !== '_all' ? filterStoreId : undefined,
      });
      return res.data as Record<string, unknown>[];
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const rows = await fetchAllForExport();
      const dateTag = new Date().toISOString().slice(0, 10);
      exportToExcel(rows, exportColumns, `Generated_Bills_${dateTag}`);
      toast.success('Excel file downloaded');
    } catch {
      toast.error('Failed to export Excel');
    }
  };

  const handleExportPdf = async () => {
    try {
      const rows = await fetchAllForExport();
      const dateTag = new Date().toLocaleDateString('en-IN');
      exportToPdf(rows, exportColumns, {
        title: 'Generated Bills Report',
        subtitle: `Total Records: ${rows.length}`,
        filename: `Generated_Bills_${new Date().toISOString().slice(0, 10)}`,
        orientation: 'landscape',
      });
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  const users: AppUser[] = usersData?.data ?? [];
  const stores: Store[] = storesData ?? [];
  const bills = data?.data ?? [];

  const openDiscount = async (order: Order) => {
    try {
      const full = await orderService.getById(order.id);
      setDiscountOrder(full);
      // Pre-populate if discount already applied
      if (full.discountType && full.discountValue != null) {
        setDiscountType(full.discountType);
        setDiscountValue(String(full.discountValue));
      } else {
        setDiscountType('PERCENTAGE');
        setDiscountValue('');
      }
    } catch {
      toast.error('Failed to load bill for discount');
    }
  };

  const ActionButtons = ({ order }: { order: Order }) => (
    <div className="flex flex-wrap gap-1">
      <Button size="sm" variant="ghost" title="View" onClick={() => openView(order)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" title="Edit" onClick={() => openEdit(order)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" title="Reprint" onClick={() => handleReprint(order)}>
        <Printer className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" title="Download PDF" onClick={() => handleDownload(order)}>
        <Download className="h-4 w-4" />
      </Button>
      {isAdmin && (
        <Button
          size="sm"
          variant="ghost"
          title="Apply Discount (Admin)"
          className={order.discountType && Number(order.discountValue) > 0 ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'}
          onClick={() => openDiscount(order)}
        >
          <Tag className="h-4 w-4" />
        </Button>
      )}
      <Button size="sm" variant="ghost" className="text-destructive" title="Delete" onClick={() => setDeleteId(order.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const columns: ColumnDef<Order>[] = [
    {
      key: 'billNumber',
      header: 'Bill No.',
      cell: (r) => <span className="font-semibold text-primary">{r.billNumber}</span>,
    },
    {
      key: 'createdAt',
      header: 'Date',
      cell: (r) => <span className="text-sm">{formatBillDate(r.createdAt)}</span>,
    },
    { key: 'store', header: 'Store', cell: (r) => r.store?.name ?? '—' },
    ...(isAdmin
      ? [{
          key: 'user',
          header: 'Created By',
          cell: (r: Order) => (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm">{r.user?.username ?? '—'}</span>
              {r.user?.operatorType && (
                <Badge variant={r.user.operatorType === 'CASH' ? 'success' : 'warning'} className="text-[10px]">
                  {getOperatorTypeDisplay(r.user.operatorType)}
                </Badge>
              )}
            </div>
          ),
        }]
      : []),
    {
      key: 'totalAmount',
      header: 'Total',
      cell: (r) => (
        <div className="flex flex-col gap-0.5">
          {r.discountType && Number(r.discountValue) > 0 ? (
            <>
              <span className="font-medium text-sm">{formatCurrency(r.totalAmount)}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium w-fit">
                {r.discountType === 'PERCENTAGE' ? `${Number(r.discountValue)}% off` : `₹${Number(r.discountValue)} off`}
              </span>
            </>
          ) : (
            <span className="font-medium">{formatCurrency(r.totalAmount)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      cell: (r) => r.itemCount ?? r.orderItems?.length ?? 0,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (r) => <ActionButtons order={r} />,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Generated Bills"
        description={isAdmin ? 'All bills with user filter' : 'Your generated bills'}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs sm:h-9 sm:text-sm"
              onClick={handleExportExcel}
              disabled={isExporting}
              title="Export to Excel"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{isExporting ? 'Exporting…' : 'Excel'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs sm:h-9 sm:text-sm"
              onClick={handleExportPdf}
              disabled={isExporting}
              title="Export to PDF"
            >
              <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{isExporting ? 'Exporting…' : 'PDF'}</span>
            </Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <SearchInput
          placeholder="Search bill number, store..."
          onChange={(v) => { setSearch(v); reset(); }}
          className="flex-1"
        />
        {isAdmin && (
          <Select value={filterStoreId || '_all'} onValueChange={(v) => { setFilterStoreId(v === '_all' ? '' : v); reset(); }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All Stores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Stores</SelectItem>
              {stores.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {isAdmin && (
          <Select value={filterUserId || '_all'} onValueChange={(v) => { setFilterUserId(v === '_all' ? '' : v); reset(); }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Users</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'createdAt' | 'billNumber')}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">By Date</SelectItem>
            <SelectItem value="billNumber">By Bill No.</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="gap-2 shrink-0">
          <ArrowUpDown className="h-4 w-4" />
          {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
        </Button>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
        ) : bills.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No bills found</p>
        ) : (
          bills.map((order) => (
            <div key={order.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-primary">{order.billNumber}</p>
                  <p className="text-xs text-muted-foreground">{formatBillDate(order.createdAt)}</p>
                </div>
                <p className="font-bold text-base shrink-0">{formatCurrency(order.totalAmount)}</p>
              </div>
              <p className="text-sm text-muted-foreground truncate">{order.store?.name}</p>
              {isAdmin && order.user && (
                <p className="text-xs text-muted-foreground">By: {order.user.username}</p>
              )}
              <p className="text-xs text-muted-foreground font-medium">{order.itemCount ?? 0} items</p>
              {order.discountType && Number(order.discountValue) > 0 && (
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3 w-3 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">
                    Discount: {order.discountType === 'PERCENTAGE' ? `${Number(order.discountValue)}%` : formatCurrency(Number(order.discountValue))} (Admin)
                  </span>
                </div>
              )}
              <div className="grid grid-cols-4 gap-2 pt-1.5">
                <Button size="sm" variant="outline" className="h-9 w-full flex items-center justify-center p-0 shadow-sm" onClick={() => openView(order)} title="View bill">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button size="sm" variant="outline" className="h-9 w-full flex items-center justify-center p-0 shadow-sm" onClick={() => openEdit(order)} title="Edit bill">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button size="sm" variant="outline" className="h-9 w-full flex items-center justify-center p-0 shadow-sm" onClick={() => handleDownload(order)} title="Download PDF">
                  <Download className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button size="sm" variant="outline" className="h-9 w-full flex items-center justify-center p-0 shadow-sm text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(order.id)} title="Delete bill">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border bg-card shadow-sm overflow-hidden">
        <DataTable
          columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
          data={bills as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          getRowKey={(r) => (r as unknown as Order).id}
        />
      </div>

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

      <BillPreviewModal
        order={viewOrder}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onDownloadPdf={() => viewOrder && handleDownload(viewOrder)}
        onShare={handleShare}
      />

      {/* ── Discount Dialog (Admin-only) ── */}
      <Dialog open={!!discountOrder} onOpenChange={(o) => {
        if (!o) { setDiscountOrder(null); setDiscountValue(''); setDiscountType('PERCENTAGE'); }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-600" />
              Apply Discount — {discountOrder?.billNumber}
            </DialogTitle>
          </DialogHeader>

          {discountOrder && (() => {
            const orderTotal = (discountOrder.orderItems ?? []).reduce(
              (sum, item) => sum + Number(item.lineTotal), 0
            ) || Number(discountOrder.totalAmount);
            const parsed = Number(discountValue);
            const isValid = !isNaN(parsed) && parsed > 0 &&
              (discountType === 'PERCENTAGE' ? parsed <= 100 : parsed <= orderTotal);
            const discountAmount = isValid
              ? discountType === 'PERCENTAGE'
                ? (orderTotal * parsed) / 100
                : parsed
              : 0;
            const finalAmount = Math.max(0, orderTotal - discountAmount);

            return (
              <div className="space-y-4 pt-1">
                {/* Existing discount badge */}
                {discountOrder.discountType && Number(discountOrder.discountValue) > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <Tag className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Current discount: <strong>
                        {discountOrder.discountType === 'PERCENTAGE'
                          ? `${Number(discountOrder.discountValue)}%`
                          : formatCurrency(Number(discountOrder.discountValue))}
                      </strong> (will be replaced)
                    </span>
                  </div>
                )}

                {/* Discount type selector */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Discount Type</Label>
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'PERCENTAGE' | 'FIXED')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                      <SelectItem value="FIXED">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Discount value input */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {discountType === 'PERCENTAGE' ? 'Discount (%)' : 'Discount Amount (₹)'}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={discountType === 'PERCENTAGE' ? 100 : orderTotal}
                    step={discountType === 'PERCENTAGE' ? 0.5 : 1}
                    placeholder={discountType === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 500'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="text-sm"
                  />
                  {discountType === 'PERCENTAGE' && (
                    <p className="text-xs text-muted-foreground">Enter a value between 0 and 100</p>
                  )}
                  {discountType === 'FIXED' && (
                    <p className="text-xs text-muted-foreground">Max: {formatCurrency(orderTotal)}</p>
                  )}
                </div>

                {/* Live preview */}
                {isValid && (
                  <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide">Preview</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatCurrency(orderTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-amber-700">
                      <span>Discount</span>
                      <span className="font-semibold">− {formatCurrency(discountAmount)}</span>
                    </div>
                    <div className="border-t border-amber-200 pt-1.5 flex justify-between">
                      <span className="text-sm font-bold text-gray-800">Final Amount</span>
                      <span className="text-base font-bold text-indigo-700">{formatCurrency(finalAmount)}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => { setDiscountOrder(null); setDiscountValue(''); setDiscountType('PERCENTAGE'); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => discountMut.mutate()}
                    disabled={!isValid || discountMut.isPending}
                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    {discountMut.isPending ? 'Applying…' : 'Apply Discount'}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editOrder} onOpenChange={(o) => !o && setEditOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bill {editOrder?.billNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {editItems.map((item, idx) => (
              <div key={item.productId} className="flex items-center gap-2 border-b pb-2">
                <span className="flex-1 text-sm font-medium truncate">{item.modelName}</span>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() =>
                      setEditItems((items) =>
                        items.map((it, i) =>
                          i === idx ? { ...it, quantity: Math.max(0, it.quantity - 1) } : it
                        )
                      )
                    }
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() =>
                      setEditItems((items) =>
                        items.map((it, i) =>
                          i === idx
                            ? { ...it, quantity: Math.min(it.maxQty, it.quantity + 1) }
                            : it
                        )
                      )
                    }
                    disabled={item.quantity >= item.maxQty}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    title="Remove item"
                    onClick={() => setEditItems((items) => items.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOrder(null)}>Cancel</Button>
            <Button
              onClick={() => updateMut.mutate()}
              disabled={updateMut.isPending || editItems.filter((i) => i.quantity > 0).length === 0}
            >
              {updateMut.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Bill"
        description="This will restore product stock and remove the ledger entry. This action cannot be undone."
        onConfirm={() => deleteMut.mutate(deleteId!)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
