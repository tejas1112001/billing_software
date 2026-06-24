import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Loader2,
  Receipt as ReceiptIcon,
  FileText,
  Package,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Users,
  Banknote,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { StoreCombobox } from '@/components/common/StoreCombobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ledgerService } from '@/services/ledgerService';
import { orderService } from '@/services/orderService';
import { receiptService } from '@/services/receiptService';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatDateTime } from '@/utils/formatDate';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import type { Store, LedgerEntry, Order, Receipt } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

// Desktop table shows 3 summary rows; mobile uses separate summary cards
const DATA_ROWS_PER_PAGE = 10;
const MOBILE_ROWS_PER_PAGE = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type EntryLabel = 'Sales' | 'Receipt' | 'Payment';

function getEntryLabel(entry: LedgerEntry): EntryLabel {
  if (entry.voucherType === 'ORDER') return 'Sales';
  const vch = (entry.billSerialNumber ?? '').toUpperCase();
  if (vch.startsWith('PAY')) return 'Payment';
  return 'Receipt';
}

function TypeBadge({ label }: { label: EntryLabel }) {
  if (label === 'Sales')
    return (
      <span className="inline-flex items-center rounded px-1.5 py-px text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200 leading-tight">
        Sales
      </span>
    );
  if (label === 'Payment')
    return (
      <span className="inline-flex items-center rounded px-1.5 py-px text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200 leading-tight">
        Payment
      </span>
    );
  return (
    <span className="inline-flex items-center rounded px-1.5 py-px text-[10px] font-semibold bg-green-100 text-green-700 border border-green-200 leading-tight">
      Receipt
    </span>
  );
}

// ─── Bill Detail Modal ────────────────────────────────────────────────────────

function BillDetailModal({
  orderId,
  open,
  onClose,
}: {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order-detail', orderId],
    queryFn: () => orderService.getById(orderId!),
    enabled: !!orderId && open,
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Bill Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : order ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Bill No.</p>
                <p className="font-semibold">{order.billNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Date</p>
                <p className="font-semibold">{formatDateTime(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Store</p>
                <p className="font-semibold">{order.store?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Voucher Type</p>
                <Badge variant="destructive" className="mt-0.5">Sales</Badge>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Items</p>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-xs">Product</th>
                      <th className="text-right px-3 py-2 font-medium text-xs">Qty</th>
                      <th className="text-right px-3 py-2 font-medium text-xs">Unit Price</th>
                      <th className="text-right px-3 py-2 font-medium text-xs">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.orderItems?.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2 font-medium">
                          <div className="flex items-center gap-2">
                            {item.product?.imageUrl ? (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.modelName}
                                className="h-7 w-7 rounded object-cover shrink-0"
                              />
                            ) : (
                              <div className="h-7 w-7 bg-muted rounded flex items-center justify-center shrink-0">
                                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="text-xs">{item.product?.modelName ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-xs">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-xs">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-right text-xs font-semibold">{formatCurrency(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center font-bold border-t pt-3 text-sm">
              <span>Total Amount (Debit)</span>
              <span className="text-red-600 text-base">{formatCurrency(order.totalAmount)}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => orderService.downloadPdf(order.id, order.billNumber)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-4 text-center">Order not found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Receipt Detail Modal ─────────────────────────────────────────────────────

function ReceiptDetailModal({
  receiptId,
  open,
  onClose,
}: {
  receiptId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: receipt, isLoading } = useQuery<Receipt>({
    queryKey: ['receipt-detail', receiptId],
    queryFn: () => receiptService.getById(receiptId!),
    enabled: !!receiptId && open,
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptIcon className="h-4 w-4 text-green-600" />
            Receipt Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
        ) : receipt ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Receipt No.</p>
              <p className="font-semibold">{receipt.receiptNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Date</p>
              <p className="font-semibold">{formatDate(receipt.date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Store</p>
              <p className="font-semibold">{receipt.store?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Voucher Type</p>
              <Badge className="mt-0.5 bg-green-100 text-green-800 hover:bg-green-100">Receipt</Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Payment Method</p>
              <p className="font-semibold">{receipt.paymentMethod?.name ?? receipt.paymentMode}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Amount (Credit)</p>
              <p className="font-bold text-green-600 text-base">{formatCurrency(receipt.amount)}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-4 text-center">Receipt not found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Ledger Table ─────────────────────────────────────────────────────────────

function LedgerTable({
  allEntries,
  openingBalance,
  onOpenDetail,
  isMobile = false,
}: {
  allEntries: LedgerEntry[];
  openingBalance: number;
  onOpenDetail: (entry: LedgerEntry) => void;
  isMobile?: boolean;
}) {
  const [page, setPage] = useState(1);

  const rowsPerPage = isMobile ? MOBILE_ROWS_PER_PAGE : DATA_ROWS_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(allEntries.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageEntries = allEntries.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage,
  );

  const totalDebit = allEntries.reduce((sum, e) => e.voucherType === 'ORDER' ? sum + Number(e.amount) : sum, 0);
  const totalCredit = allEntries.reduce((sum, e) => e.voucherType !== 'ORDER' ? sum + Number(e.amount) : sum, 0);

  // ── Page number buttons ───────────────────────────────────────────────────
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    const around = new Set(
      [1, totalPages, safePage - 1, safePage, safePage + 1].filter((p) => p >= 1 && p <= totalPages),
    );
    let prev = 0;
    for (const p of [...around].sort((a, b) => a - b)) {
      if (p - prev > 1) pages.push('...');
      pages.push(p);
      prev = p;
    }
    return pages;
  }, [totalPages, safePage]);

  if (allEntries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-xs">
        No ledger entries found for the selected filters.
      </div>
    );
  }

  const start = (safePage - 1) * rowsPerPage + 1;
  const end = Math.min(safePage * rowsPerPage, allEntries.length);
  const closingBalance = openingBalance + totalDebit - totalCredit;

  return (
    <div>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2 mb-3">
        {pageEntries.map((entry) => {
          const isOrder = entry.voucherType === 'ORDER';
          const label = getEntryLabel(entry);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onOpenDetail(entry)}
              className="w-full text-left rounded-lg border bg-card p-3 shadow-sm active:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className="text-xs text-muted-foreground">{formatDate(entry.date, 'd-MMM-yy')}</p>
                  <p className="text-sm font-medium truncate">{entry.customerName ?? entry.billSerialNumber ?? '—'}</p>
                </div>
                <TypeBadge label={label} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-xs font-mono text-muted-foreground">{entry.billSerialNumber ?? '—'}</span>
                {isOrder ? (
                  <span className="font-semibold text-red-600">{formatCurrency(entry.amount)}</span>
                ) : (
                  <span className="font-semibold text-green-700">{formatCurrency(entry.amount)}</span>
                )}
              </div>
            </button>
          );
        })}
        {/* Mobile summary strip */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <div className="rounded-lg border bg-blue-50/80 p-2 text-center">
            <p className="text-[9px] text-blue-700 font-semibold uppercase">Opening</p>
            <p className="text-xs font-bold text-blue-800 tabular-nums">{formatCurrency(openingBalance)}</p>
          </div>
          <div className="rounded-lg border bg-green-50/80 p-2 text-center">
            <p className="text-[9px] text-green-700 font-semibold uppercase">Dr / Cr</p>
            <p className="text-[10px] font-bold tabular-nums">
              <span className="text-red-600">{formatCurrency(totalDebit)}</span>
              <span className="text-muted-foreground mx-0.5">/</span>
              <span className="text-green-700">{formatCurrency(totalCredit)}</span>
            </p>
          </div>
          <div className="rounded-lg border bg-slate-100 p-2 text-center">
            <p className="text-[9px] text-slate-700 font-semibold uppercase">Closing</p>
            <p className="text-xs font-bold text-slate-800 tabular-nums">{formatCurrency(closingBalance)}</p>
          </div>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-xs min-w-[560px]">
          <thead>
            <tr className="bg-[#1e1b4b] text-white">
              <th className="text-left px-2 py-1.5 font-semibold w-20">Date</th>
              <th className="text-left px-2 py-1.5 font-semibold hidden sm:table-cell">Particulars</th>
              <th className="text-left px-2 py-1.5 font-semibold w-20">Type</th>
              <th className="text-right px-2 py-1.5 font-semibold w-32 hidden md:table-cell">Vch No.</th>
              <th className="text-right px-2 py-1.5 font-semibold w-24">Debit</th>
              <th className="text-right px-2 py-1.5 font-semibold w-24">Credit</th>
            </tr>
          </thead>
          <tbody>
            {pageEntries.map((entry, idx) => {
              const isOrder = entry.voucherType === 'ORDER';
              const label = getEntryLabel(entry);
              return (
                <tr
                  key={entry.id}
                  onDoubleClick={() => onOpenDetail(entry)}
                  className={`border-b border-border/60 cursor-pointer transition-colors ${
                    idx % 2 === 0
                      ? 'bg-white hover:bg-indigo-50/50'
                      : 'bg-slate-50/60 hover:bg-indigo-50/50'
                  }`}
                >
                  <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">
                    {formatDate(entry.date, 'd-MMM-yy')}
                  </td>
                  <td className="px-2 py-1.5 font-medium hidden sm:table-cell">
                    {entry.customerName ?? '—'}
                  </td>
                  <td className="px-2 py-1.5">
                    <TypeBadge label={label} />
                  </td>
                  <td className="px-2 py-1.5 text-right text-muted-foreground font-mono hidden md:table-cell">
                    {entry.billSerialNumber ?? '—'}
                  </td>
                  <td className="px-2 py-1.5 text-right font-semibold text-red-600 tabular-nums">
                    {isOrder ? formatCurrency(entry.amount) : <span className="text-muted-foreground/50 font-normal">—</span>}
                  </td>
                  <td className="px-2 py-1.5 text-right font-semibold text-green-700 tabular-nums">
                    {!isOrder ? formatCurrency(entry.amount) : <span className="text-muted-foreground/50 font-normal">—</span>}
                  </td>
                </tr>
              );
            })}

            {/* ── Opening Balance ───────────────────────────────────────── */}
            <tr className="border-t border-slate-200 bg-blue-50/70">
              <td className="px-2 py-1.5 font-semibold text-blue-800 whitespace-nowrap">Opening Bal.</td>
              <td className="px-2 py-1.5 hidden sm:table-cell" />
              <td className="px-2 py-1.5" />
              <td className="px-2 py-1.5 hidden md:table-cell" />
              <td className="px-2 py-1.5 text-right text-muted-foreground/40">—</td>
              <td className="px-2 py-1.5 text-right font-semibold text-blue-700 tabular-nums">
                {formatCurrency(openingBalance)}
              </td>
            </tr>

            {/* ── Current Total ─────────────────────────────────────────── */}
            <tr className="border-t border-slate-200 bg-green-50/70">
              <td className="px-2 py-1.5 font-semibold text-green-800 whitespace-nowrap">Current Total</td>
              <td className="px-2 py-1.5 hidden sm:table-cell" />
              <td className="px-2 py-1.5" />
              <td className="px-2 py-1.5 hidden md:table-cell" />
              <td className="px-2 py-1.5 text-right font-semibold text-red-600 tabular-nums">
                {formatCurrency(totalDebit)}
              </td>
              <td className="px-2 py-1.5 text-right font-semibold text-green-700 tabular-nums">
                {formatCurrency(totalCredit)}
              </td>
            </tr>

            {/* ── Closing Balance ───────────────────────────────────────── */}
            <tr className="border-t-2 border-slate-300 bg-slate-100">
              <td className="px-2 py-1.5 font-bold text-slate-800 whitespace-nowrap">Closing Bal.</td>
              <td className="px-2 py-1.5 hidden sm:table-cell" />
              <td className="px-2 py-1.5" />
              <td className="px-2 py-1.5 hidden md:table-cell" />
              <td className="px-2 py-1.5 text-right text-muted-foreground/40">—</td>
              <td className="px-2 py-1.5 text-right font-bold text-slate-800 tabular-nums">
                {formatCurrency(openingBalance + totalDebit - totalCredit)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-0">
        <p className="text-[11px] text-muted-foreground">
          {start}–{end} of {allEntries.length}
        </p>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] text-muted-foreground border border-border/60 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            Prev
          </button>

          {pageNumbers.map((pn, i) =>
            pn === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-[11px] text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={pn}
                onClick={() => setPage(pn as number)}
                className={`w-6 h-6 rounded text-[11px] font-medium transition-colors ${
                  safePage === pn
                    ? 'bg-[#1e1b4b] text-white'
                    : 'border border-border/60 bg-white text-muted-foreground hover:bg-slate-50'
                }`}
              >
                {pn}
              </button>
            ),
          )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] text-muted-foreground border border-border/60 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LedgerPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [obAmount, setObAmount] = useState('');
  const [operatorFilter, setOperatorFilter] = useState<'ALL' | 'CASH' | 'CREDIT'>('ALL');
  const [detailEntry, setDetailEntry] = useState<LedgerEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['ledger', selectedStore?.id, operatorFilter],
    queryFn: () =>
      ledgerService.getLedger(selectedStore!.id, {
        pageSize: 1000,
        page: 1,
        operatorType: isAdmin && operatorFilter !== 'ALL' ? operatorFilter : undefined,
      }),
    enabled: !!selectedStore,
  });

  const entries: LedgerEntry[] = data?.data ?? [];
  const openingBalance: number = data?.openingBalance ?? 0;

  const obMutation = useMutation({
    mutationFn: () =>
      ledgerService.upsertOpeningBalance({ storeId: selectedStore!.id, amount: Number(obAmount) }),
    onSuccess: () => {
      toast.success('Opening balance saved');
      qc.invalidateQueries({ queryKey: ['ledger'] });
    },
    onError: () => toast.error('Failed to save opening balance'),
  });

  const handleOpenDetail = (entry: LedgerEntry) => {
    setDetailEntry(entry);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setTimeout(() => setDetailEntry(null), 300);
  };

  const handleChangeStore = () => {
    setSelectedStore(null);
    setObAmount('');
    setOperatorFilter('ALL');
  };

  const handleExportExcel = async () => {
    if (!selectedStore) return;
    setExporting(true);
    try {
      await ledgerService.exportExcel(selectedStore.id, {
        operatorType: isAdmin && operatorFilter !== 'ALL' ? operatorFilter : undefined,
      });
      toast.success('Ledger exported to Excel');
    } catch {
      toast.error('Failed to export ledger');
    } finally {
      setExporting(false);
    }
  };

  // ── Step 1: store not selected ──────────────────────────────────────────────
  if (!selectedStore) {
    return (
      <div className="max-w-lg mx-auto px-2 py-4">
        <PageHeader title="Ledger" description="Select a store to view its ledger" />
        <div className="mt-4">
          <Label className="text-sm font-medium mb-2 block">Store</Label>
          <StoreCombobox value={selectedStore} onChange={setSelectedStore} />
        </div>
      </div>
    );
  }

  // ── Step 2: store selected, show ledger ─────────────────────────────────────
  return (
    <div className="w-full px-2 sm:px-3 py-3 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={handleChangeStore}
            className="inline-flex items-center justify-center h-7 w-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
            title="Change store"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <span className="font-bold text-base leading-tight truncate block">{selectedStore.name}</span>
            <span className="text-xs text-muted-foreground">{selectedStore.city}</span>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs shrink-0 gap-1.5"
          onClick={handleExportExcel}
          disabled={exporting || isLoading}
        >
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Export Excel</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </div>

      {/* Admin: filter + opening balance — single row on desktop */}
      {isAdmin && (
        <div className="rounded-xl border bg-card p-3 shadow-sm space-y-3 lg:space-y-0 lg:flex lg:items-end lg:gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wide flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Filter Transactions
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {([
                { key: 'ALL' as const, label: 'All', icon: Users },
                { key: 'CASH' as const, label: 'Cash', icon: Banknote },
                { key: 'CREDIT' as const, label: 'Credit', icon: CreditCard },
              ]).map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  size="sm"
                  variant={operatorFilter === key ? 'default' : 'outline'}
                  className={cn('h-8 text-xs flex-1 sm:flex-none min-w-[72px]', operatorFilter === key && 'shadow-sm')}
                  onClick={() => setOperatorFilter(key)}
                >
                  <Icon className="h-3 w-3 mr-1 shrink-0" />
                  <span>{label}</span>
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:border-l lg:pl-4">
            <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide whitespace-nowrap">
              Opening Balance
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={obAmount}
              onChange={(e) => setObAmount(e.target.value)}
              className="w-28 h-8 text-xs"
            />
            <Button
              size="sm"
              className="h-8 text-xs px-3"
              onClick={() => obMutation.mutate()}
              disabled={obMutation.isPending}
            >
              {obMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
            </Button>
            {data?.openingBalance !== undefined && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Current: <span className="font-semibold text-foreground">{formatCurrency(data.openingBalance)}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Ledger card — full width, minimal padding */}
      <div className="w-full rounded-lg border overflow-hidden bg-white shadow-sm">
        {/* Title bar */}
        <div className="bg-[#1e1b4b] text-white px-3 py-1.5 flex items-center justify-between">
          <div>
            <span className="text-[9px] text-indigo-300 uppercase tracking-widest font-semibold">
              Ledger Vouchers
            </span>
            <span className="text-xs font-semibold ml-2 text-white/90">{selectedStore.name}</span>
          </div>
        </div>

        <div className="p-2">
          {isLoading ? (
            <div className="space-y-1.5 py-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="md:hidden">
                <LedgerTable
                  allEntries={entries}
                  openingBalance={openingBalance}
                  onOpenDetail={handleOpenDetail}
                  isMobile
                />
              </div>
              <div className="hidden md:block">
                <LedgerTable
                  allEntries={entries}
                  openingBalance={openingBalance}
                  onOpenDetail={handleOpenDetail}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail modals */}
      {detailEntry?.voucherType === 'ORDER' && (
        <BillDetailModal
          orderId={detailEntry.orderId ?? null}
          open={detailOpen}
          onClose={handleCloseDetail}
        />
      )}
      {detailEntry?.voucherType === 'RECEIPT' && (
        <ReceiptDetailModal
          receiptId={detailEntry.receiptId ?? null}
          open={detailOpen}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}
