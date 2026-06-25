import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Eye, Pencil, Trash2, Printer, Download, ArrowUpDown, Plus, Minus,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { orderService } from '@/services/orderService';
import { userService } from '@/services/userService';
import { api } from '@/services/api';
import { usePagination } from '@/hooks/usePagination';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateTime } from '@/utils/formatDate';
import { getOperatorTypeDisplay } from '@/utils/operatorTypeDisplay';
import type { Order, OrderItem, PaginatedResponse, AppUser } from '@/types';

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
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<Array<{ productId: string; modelName: string; quantity: number; maxQty: number }>>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: usersData } = useQuery({
    queryKey: ['users-for-filter'],
    queryFn: () => userService.list({ pageSize: 100 }),
    enabled: isAdmin,
  });

  const { data, isLoading } = useQuery<PaginatedResponse<Order>>({
    queryKey: ['generated-bills', page, pageSize, search, sortBy, sortOrder, filterUserId],
    queryFn: () =>
      orderService.list({
        page,
        pageSize,
        search: search || undefined,
        sortBy,
        sortOrder,
        userId: filterUserId && filterUserId !== '_all' ? filterUserId : undefined,
      }),
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
          modelName: item.product?.modelName ?? 'Product',
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

  const users: AppUser[] = usersData?.data ?? [];
  const bills = data?.data ?? [];

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
      cell: (r) => <span className="font-medium">{formatCurrency(r.totalAmount)}</span>,
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
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <SearchInput
          placeholder="Search bill number, store..."
          onChange={(v) => { setSearch(v); reset(); }}
          className="flex-1"
        />
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
                <p className="text-xs">By: {order.user.username}</p>
              )}
              <p className="text-xs text-muted-foreground">{order.itemCount ?? 0} items</p>
              <div className="flex gap-2 pt-1 flex-wrap">
                <Button size="sm" variant="outline" className="flex-1 min-w-[80px]" onClick={() => openView(order)}>
                  <Eye className="h-4 w-4 mr-1" /> View
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(order)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDownload(order)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteId(order.id)}>
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
