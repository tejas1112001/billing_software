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
  BookOpen,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { Card } from '@/components/ui/card';
import { ledgerService } from '@/services/ledgerService';
import { orderService } from '@/services/orderService';
import { receiptService } from '@/services/receiptService';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatDateTime } from '@/utils/formatDate';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import type { Store, LedgerEntry, Order, Receipt } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

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
      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">
        Sales
      </span>
    );
  if (label === 'Payment')
    return (
      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
        Payment
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
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
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            Bill Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : order ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground text-xs mb-0.5">Bill No.</p>
                  <p className="font-semibold">{order.billNumber}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground text-xs mb-0.5">Date</p>
                  <p className="font-semibold text-xs">{formatDateTime(order.createdAt)}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground text-xs mb-0.5">Store</p>
                  <p className="font-semibold">{order.store?.name ?? '—'}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-muted-foreground text-xs mb-0.5">Total (Debit)</p>
                  <p className="font-bold text-red-600">{formatCurrency(order.totalAmount)}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wider">Items</p>
                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-xs">Product</th>
                        <th className="text-right px-3 py-2 font-semibold text-xs">Qty</th>
                        <th className="text-right px-3 py-2 font-semibold text-xs hidden sm:table-cell">Price</th>
                        <th className="text-right px-3 py-2 font-semibold text-xs">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.orderItems?.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {item.product?.imageUrl ? (
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.modelName}
                                  className="h-7 w-7 rounded-md object-cover shrink-0"
                                />
                              ) : (
                                <div className="h-7 w-7 bg-muted rounded-md flex items-center justify-center shrink-0">
                                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              )}
                              <span className="text-xs font-medium">{item.product?.modelName ?? '—'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-xs font-medium">{item.quantity}</td>
                          <td className="px-3 py-2 text-right text-xs hidden sm:table-cell">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-3 py-2 text-right text-xs font-bold">{formatCurrency(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full h-9"
                onClick={() => orderService.downloadPdf(order.id, order.billNumber)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-4 text-center">Order not found.</p>
          )}
        </div>
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
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <ReceiptIcon className="h-4 w-4 text-emerald-600" />
            </div>
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-muted-foreground text-xs mb-0.5">Receipt No.</p>
                <p className="font-semibold">{receipt.receiptNumber}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-muted-foreground text-xs mb-0.5">Date</p>
                <p className="font-semibold">{formatDate(receipt.date)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-muted-foreground text-xs mb-0.5">Store</p>
                <p className="font-semibold">{receipt.store?.name ?? '—'}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-muted-foreground text-xs mb-0.5">Payment Method</p>
                <p className="font-semibold">{receipt.paymentMethod?.name ?? receipt.paymentMode}</p>
              </div>
              <div className="col-span-2 rounded-lg bg-emerald-50 p-3">
                <p className="text-muted-foreground text-xs mb-0.5">Amount (Credit)</p>
                <p className="font-bold text-emerald-600 text-lg">{formatCurrency(receipt.amount)}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9"
              onClick={() => receiptService.downloadPdf(receipt.id, receipt.receiptNumber)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-4 text-center">Receipt not found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Summary Table ────────────────────────────────────────────────────────────

function SummaryTable({
  openingBalance,
  totalDebit,
  totalCredit,
  closingBalance,
}: {
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden text-[13px] sm:text-sm shadow-sm">
      <div className="flex items-center justify-between px-3 py-2.5 sm:p-3 border-b bg-blue-50/50">
        <span className="font-semibold text-blue-800">Opening Bal.</span>
        <div className="flex items-center gap-2 sm:gap-4 text-right">
          <span className="w-20 sm:w-28 text-muted-foreground/50">—</span>
          <span className="w-24 sm:w-32 font-bold text-blue-700">{formatCurrency(openingBalance)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2.5 sm:p-3 border-b">
        <span className="font-semibold text-slate-700">Total</span>
        <div className="flex items-center gap-2 sm:gap-4 text-right">
          <span className="w-20 sm:w-28 font-bold text-red-600">{formatCurrency(totalDebit)}</span>
          <span className="w-24 sm:w-32 font-bold text-emerald-600">{formatCurrency(totalCredit)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2.5 sm:p-3 bg-slate-50">
        <span className="font-semibold text-slate-800">Closing Bal.</span>
        <div className="flex items-center gap-2 sm:gap-4 text-right">
          <span className="w-20 sm:w-28 text-muted-foreground/50">—</span>
          <span className="w-24 sm:w-32 font-bold text-slate-900">{formatCurrency(closingBalance)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Ledger Table ─────────────────────────────────────────────────────────────

function LedgerTable({
  allEntries,
  openingBalance,
  onOpenDetail,
}: {
  allEntries: LedgerEntry[];
  openingBalance: number;
  onOpenDetail: (entry: LedgerEntry) => void;
}) {
  const [page, setPage] = useState(1);

  const totalDebit = allEntries.reduce((sum, e) => e.voucherType === 'ORDER' ? sum + Number(e.amount) : sum, 0);
  const totalCredit = allEntries.reduce((sum, e) => e.voucherType !== 'ORDER' ? sum + Number(e.amount) : sum, 0);
  const closingBalance = openingBalance + totalDebit - totalCredit;

  // ── Mobile rows ───────────────────────────────────────────────────────────
  const mobilePages = Math.max(1, Math.ceil(allEntries.length / MOBILE_ROWS_PER_PAGE));
  const safeMobilePage = Math.min(page, mobilePages);
  const mobileEntries = allEntries.slice(
    (safeMobilePage - 1) * MOBILE_ROWS_PER_PAGE,
    safeMobilePage * MOBILE_ROWS_PER_PAGE,
  );

  // ── Desktop rows ──────────────────────────────────────────────────────────
  const desktopPages = Math.max(1, Math.ceil(allEntries.length / DATA_ROWS_PER_PAGE));
  const safeDesktopPage = Math.min(page, desktopPages);
  const desktopEntries = allEntries.slice(
    (safeDesktopPage - 1) * DATA_ROWS_PER_PAGE,
    safeDesktopPage * DATA_ROWS_PER_PAGE,
  );

  // ── Page number buttons ──────────────────────────────────────────────────
  const pageNumbers = useMemo(() => {
    const totalPages = Math.max(mobilePages, desktopPages);
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    const around = new Set(
      [1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages),
    );
    let prev = 0;
    for (const p of [...around].sort((a, b) => a - b)) {
      if (p - prev > 1) pages.push('...');
      pages.push(p);
      prev = p;
    }
    return pages;
  }, [mobilePages, desktopPages, page]);

  if (allEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
        <BookOpen className="h-10 w-10 opacity-20" />
        <p className="text-sm font-medium">No ledger entries found</p>
        <p className="text-xs opacity-70">Try adjusting your filters</p>
      </div>
    );
  }

  const totalPages = Math.max(mobilePages, desktopPages);
  const safePage = Math.min(page, totalPages);
  const startRow = (safePage - 1) * DATA_ROWS_PER_PAGE + 1;
  const endRow = Math.min(safePage * DATA_ROWS_PER_PAGE, allEntries.length);

  const PaginationControls = () => (
    <div className="flex items-center justify-between pt-2 border-t border-border/40">
      <p className="text-[11px] text-muted-foreground">
        {startRow}–{endRow} of {allEntries.length}
      </p>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={safePage === 1}
          className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] text-muted-foreground border border-border/60 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-3 w-3" /> Prev
        </button>
        {pageNumbers.map((pn, i) =>
          pn === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-[11px] text-muted-foreground">…</span>
          ) : (
            <button
              key={pn}
              onClick={() => setPage(pn as number)}
              className={`w-7 h-7 rounded-md text-[11px] font-medium transition-colors ${
                safePage === pn
                  ? 'bg-primary text-primary-foreground'
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
          className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] text-muted-foreground border border-border/60 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* ── Mobile card list ───────────────────────────────────────────────── */}
      <div className="md:hidden space-y-2">
        {mobileEntries.map((entry) => {
          const isOrder = entry.voucherType === 'ORDER';
          const label = getEntryLabel(entry);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onOpenDetail(entry)}
              className="w-full text-left rounded-xl border bg-card p-3 shadow-sm hover:shadow-md hover:border-primary/30 active:bg-muted/20 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <TypeBadge label={label} />
                    <span className="text-[10px] text-muted-foreground font-mono">{entry.billSerialNumber ?? '—'}</span>
                  </div>
                  <p className="text-sm font-medium truncate">{entry.customerName ?? entry.billSerialNumber ?? '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(entry.date, 'd MMM yyyy')}</p>
                </div>
                <div className="shrink-0 text-right">
                  {isOrder ? (
                    <p className="font-bold text-sm text-red-600 tabular-nums">{formatCurrency(entry.amount)}</p>
                  ) : (
                    <p className="font-bold text-sm text-emerald-600 tabular-nums">{formatCurrency(entry.amount)}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">{isOrder ? 'Debit' : 'Credit'}</p>
                </div>
              </div>
            </button>
          );
        })}
        <PaginationControls />
      </div>

      {/* ── Desktop table ──────────────────────────────────────────────────── */}
      <div className="hidden md:block overflow-hidden rounded-xl border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50 text-foreground">
              <th className="text-left px-3 py-2.5 font-semibold w-24">Date</th>
              <th className="text-left px-3 py-2.5 font-semibold">Particulars</th>
              <th className="text-center px-3 py-2.5 font-semibold w-24">Type</th>
              <th className="text-right px-3 py-2.5 font-semibold w-32 hidden md:table-cell">Vch No.</th>
              <th className="text-right px-3 py-2.5 font-semibold w-28">Debit</th>
              <th className="text-right px-3 py-2.5 font-semibold w-28">Credit</th>
            </tr>
          </thead>
          <tbody>
            {desktopEntries.map((entry, idx) => {
              const isOrder = entry.voucherType === 'ORDER';
              const label = getEntryLabel(entry);
              return (
                <tr
                  key={entry.id}
                  onDoubleClick={() => onOpenDetail(entry)}
                  onClick={() => onOpenDetail(entry)}
                  className={`border-b border-border/40 cursor-pointer transition-colors ${
                    idx % 2 === 0
                      ? 'bg-white hover:bg-indigo-50/50'
                      : 'bg-slate-50/70 hover:bg-indigo-50/50'
                  }`}
                >
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                    {formatDate(entry.date, 'd-MMM-yy')}
                  </td>
                  <td className="px-3 py-2 font-medium max-w-[160px] truncate">
                    {entry.customerName ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <TypeBadge label={label} />
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground font-mono hidden md:table-cell">
                    {entry.billSerialNumber ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-red-600 tabular-nums">
                    {isOrder ? formatCurrency(entry.amount) : <span className="text-muted-foreground/40 font-normal">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-700 tabular-nums">
                    {!isOrder ? formatCurrency(entry.amount) : <span className="text-muted-foreground/40 font-normal">—</span>}
                  </td>
                </tr>
              );
            })}

          </tbody>
        </table>
        <div className="px-3 py-2 border-t">
          <PaginationControls />
        </div>
      </div>

      {/* ── Summary Table (always visible) ────────────────────────────────── */}
      <div className="pt-1">
        <SummaryTable
          openingBalance={openingBalance}
          totalDebit={totalDebit}
          totalCredit={totalCredit}
          closingBalance={closingBalance}
        />
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
      <div className="max-w-md mx-auto px-4 py-12 flex flex-col justify-center min-h-[70vh]">
        <div className="relative overflow-hidden rounded-2xl p-6 space-y-6 border shadow-lg bg-card">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/5" />
          <div className="relative z-10 space-y-2 text-center">
            <div className="flex justify-center mb-3">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Ledger</h1>
            <p className="text-sm text-muted-foreground">Select a store to view its ledger balance sheet</p>
          </div>
          <div className="relative z-10 space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Store</Label>
            <StoreCombobox value={selectedStore} onChange={setSelectedStore} />
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: store selected ──────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl px-4 py-4 sm:px-6 sm:py-5 border bg-card shadow-sm">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/5" />
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={handleChangeStore}
            className="h-8 w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center shrink-0 transition-colors"
            title="Change store"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Ledger</p>
            <h1 className="text-base sm:text-lg font-extrabold truncate">{selectedStore.name}</h1>
            {selectedStore.city && (
              <p className="text-xs text-muted-foreground">{selectedStore.city}</p>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 h-9 text-xs gap-1.5"
            onClick={handleExportExcel}
            disabled={exporting || isLoading}
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* ── Admin controls ───────────────────────────────────────────────────── */}
      {isAdmin && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {/* Filter row */}
          <div className="p-3 sm:p-4 border-b">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Filter by Operator Type
            </p>
            <div className="flex gap-2 flex-wrap">
              {([
                { key: 'ALL' as const, label: 'All Operators', icon: Users },
                { key: 'CASH' as const, label: 'Gold', icon: Banknote },
                { key: 'CREDIT' as const, label: 'Platinum', icon: CreditCard },
              ]).map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  size="sm"
                  variant={operatorFilter === key ? 'default' : 'outline'}
                  className={cn('h-8 text-xs flex-1 sm:flex-none', operatorFilter === key && 'shadow-sm')}
                  onClick={() => setOperatorFilter(key)}
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Opening balance row */}
          <div className="p-3 sm:p-4 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                  Opening Balance
                </Label>
                {data?.openingBalance !== undefined && (
                  <p className="text-sm mt-0.5">
                    Current: <span className="font-bold text-foreground">{formatCurrency(data.openingBalance)}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 sm:w-auto w-full">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter new amount"
                  value={obAmount}
                  onChange={(e) => setObAmount(e.target.value)}
                  className="flex-1 sm:w-40 h-9 text-sm"
                />
                <Button
                  size="sm"
                  className="h-9 px-5 font-semibold shrink-0"
                  onClick={() => obMutation.mutate()}
                  disabled={obMutation.isPending || !obAmount}
                >
                  {obMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Ledger content ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Title bar */}
        <div className="bg-muted/50 border-b px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Ledger Vouchers</span>
            <span className="text-xs font-semibold ml-1">— {selectedStore.name}</span>
          </div>
          {!isLoading && entries.length > 0 && (
            <span className="text-[10px] text-muted-foreground font-medium">{entries.length} entries</span>
          )}
        </div>

        <div className="p-3 sm:p-4">
          {isLoading ? (
            <div className="space-y-2.5 py-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <LedgerTable
              allEntries={entries}
              openingBalance={openingBalance}
              onOpenDetail={handleOpenDetail}
            />
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
