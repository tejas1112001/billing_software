import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Trash2, ArrowUpDown, Receipt as ReceiptIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { receiptService } from '@/services/receiptService';
import { paymentMethodService } from '@/services/paymentMethodService';
import { userService } from '@/services/userService';
import { usePagination } from '@/hooks/usePagination';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatDateTime } from '@/utils/formatDate';
import { getOperatorTypeDisplay } from '@/utils/operatorTypeDisplay';
import type { Receipt, PaginatedResponse, AppUser, PaymentMethod } from '@/types';

export default function GeneratedReceiptsPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const { page, pageSize, setPage, setPageSize, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterUserId, setFilterUserId] = useState('');
  const [viewId, setViewId] = useState<string | null>(null);
  const [editReceipt, setEditReceipt] = useState<Receipt | null>(null);
  const [editForm, setEditForm] = useState({ paymentMethodId: '', amount: '', date: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: usersData } = useQuery({
    queryKey: ['users-for-filter'],
    queryFn: () => userService.list({ pageSize: 100 }),
    enabled: isAdmin,
  });

  const { data, isLoading } = useQuery<PaginatedResponse<Receipt>>({
    queryKey: ['generated-receipts', page, pageSize, search, sortOrder, filterUserId],
    queryFn: () =>
      receiptService.list({
        page,
        pageSize,
        search: search || undefined,
        sortOrder,
        userId: filterUserId && filterUserId !== '_all' ? filterUserId : undefined,
      }),
  });

  const { data: viewReceipt, isLoading: loadingView } = useQuery<Receipt>({
    queryKey: ['receipt-view', viewId],
    queryFn: () => receiptService.getById(viewId!),
    enabled: !!viewId,
  });

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods'],
    queryFn: () => paymentMethodService.getAll(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => receiptService.delete(id),
    onSuccess: () => {
      toast.success('Receipt deleted');
      qc.invalidateQueries({ queryKey: ['generated-receipts'] });
      setDeleteId(null);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to delete receipt');
    },
  });

  const updateMut = useMutation({
    mutationFn: () =>
      receiptService.update(editReceipt!.id, {
        paymentMethodId: editForm.paymentMethodId,
        amount: Number(editForm.amount),
        date: editForm.date,
      }),
    onSuccess: () => {
      toast.success('Receipt updated');
      qc.invalidateQueries({ queryKey: ['generated-receipts'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      setEditReceipt(null);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Failed to update receipt');
    },
  });

  const openEdit = async (receipt: Receipt) => {
    try {
      const full = await receiptService.getById(receipt.id);
      setEditReceipt(full);
      setEditForm({
        paymentMethodId: full.paymentMethodId ?? full.paymentMethod?.id ?? '',
        amount: String(full.amount),
        date: full.date.slice(0, 10),
      });
    } catch {
      toast.error('Failed to load receipt for editing');
    }
  };

  const users: AppUser[] = usersData?.data ?? [];

  const columns: ColumnDef<Receipt>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt No.',
      cell: (r) => <span className="font-semibold text-emerald-700">{r.receiptNumber}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      cell: (r) => <span className="text-sm">{formatDateTime(r.date)}</span>,
    },
    ...(isAdmin
      ? [{
          key: 'user',
          header: 'Created By',
          cell: (r: Receipt) => (
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
    { key: 'store', header: 'Store', cell: (r) => r.store?.name ?? '—' },
    {
      key: 'amount',
      header: 'Amount',
      cell: (r) => <span className="font-medium">{formatCurrency(r.amount)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (r) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" title="View" onClick={() => setViewId(r.id)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" title="Edit" onClick={() => openEdit(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" title="Delete" onClick={() => setDeleteId(r.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const receipts = data?.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Generated Receipts"
        description={isAdmin ? 'All receipts with user filter' : 'Your generated receipts'}
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <SearchInput
          placeholder="Search receipt number, store..."
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
        <Button variant="outline" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="gap-2 shrink-0">
          <ArrowUpDown className="h-4 w-4" />
          {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
        </Button>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
        ) : receipts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No receipts found</p>
        ) : (
          receipts.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-emerald-700">{r.receiptNumber}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.date)}</p>
                </div>
                <p className="font-bold text-base">{formatCurrency(r.amount)}</p>
              </div>
              <p className="text-sm text-muted-foreground">{r.store?.name}</p>
              {isAdmin && r.user && (
                <p className="text-xs">By: {r.user.username}</p>
              )}
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setViewId(r.id)}>
                  <Eye className="h-4 w-4 mr-1" /> View
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteId(r.id)}>
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
          data={receipts as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          getRowKey={(r) => (r as unknown as Receipt).id}
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

      <Dialog open={!!viewId} onOpenChange={(o) => !o && setViewId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptIcon className="h-4 w-4" /> Receipt Details
            </DialogTitle>
          </DialogHeader>
          {loadingView || !viewReceipt ? (
            <p className="text-sm text-muted-foreground py-4">Loading...</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Receipt No.</p><p className="font-semibold">{viewReceipt.receiptNumber}</p></div>
              <div><p className="text-xs text-muted-foreground">Date</p><p className="font-semibold">{formatDate(viewReceipt.date)}</p></div>
              <div><p className="text-xs text-muted-foreground">Store</p><p className="font-semibold">{viewReceipt.store?.name}</p></div>
              <div><p className="text-xs text-muted-foreground">Amount</p><p className="font-bold text-emerald-600">{formatCurrency(viewReceipt.amount)}</p></div>
              {viewReceipt.user && (
                <div className="col-span-2"><p className="text-xs text-muted-foreground">Created By</p><p className="font-semibold">{viewReceipt.user.username}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editReceipt} onOpenChange={(o) => !o && setEditReceipt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Receipt {editReceipt?.receiptNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Payment Method</Label>
              <Select
                value={editForm.paymentMethodId}
                onValueChange={(v) => setEditForm((f) => ({ ...f, paymentMethodId: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.filter((m) => m.isActive).map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editForm.amount}
                onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditReceipt(null)}>Cancel</Button>
              <Button
                onClick={() => updateMut.mutate()}
                disabled={updateMut.isPending || !editForm.paymentMethodId || !editForm.amount || !editForm.date}
              >
                {updateMut.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Receipt"
        description="This removes the ledger entry. This action cannot be undone."
        onConfirm={() => deleteMut.mutate(deleteId!)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
