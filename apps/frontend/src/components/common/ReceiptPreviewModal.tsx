import React from 'react';
import { Download, Share2, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Receipt } from '@/types';

interface ReceiptPreviewModalProps {
  receipt: Receipt | null;
  open: boolean;
  onClose: () => void;
  onDownloadPdf: () => void;
  onShare: () => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReceiptPreviewModal({
  receipt,
  open,
  onClose,
  onDownloadPdf,
  onShare,
}: ReceiptPreviewModalProps) {
  if (!receipt) return null;

  const store = receipt.store;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-full max-w-sm p-0 gap-0 overflow-hidden flex flex-col">
        {/* ── Header ── */}
        <div className="bg-emerald-600 px-6 py-5 text-white shrink-0 relative">
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 text-white">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>

          {/* Success badge */}
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-emerald-200" />
            <span className="text-sm font-medium text-emerald-100">Receipt Created Successfully</span>
          </div>

          {store ? (
            <>
              <h2 className="text-xl font-bold leading-tight">{store.name}</h2>
              <p className="text-sm text-emerald-100 mt-0.5">
                {store.address}, {store.city}
              </p>
              <p className="text-xs text-emerald-200 mt-0.5">
                {store.mobile} · {store.email}
              </p>
            </>
          ) : (
            <h2 className="text-xl font-bold">Payment Receipt</h2>
          )}
        </div>

        {/* ── Receipt Meta ── */}
        <div className="px-6 py-4 bg-emerald-50 border-b flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Receipt No.</p>
            <p className="text-sm font-semibold text-emerald-700">{receipt.receiptNumber}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm font-medium">{formatDate(receipt.createdAt)}</p>
          </div>
          {receipt.user?.username && (
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Salesperson</p>
              <p className="text-sm font-medium">{receipt.user.username}</p>
            </div>
          )}
          {receipt.paymentMethod && (
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Payment Method</p>
              <p className="text-sm font-medium">{receipt.paymentMethod.name}</p>
            </div>
          )}
        </div>

        {/* ── Amount ── */}
        <div className="px-6 py-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Amount Received</p>
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(receipt.amount)}
          </p>
        </div>

        {/* ── Actions ── */}
        <div className="px-6 py-4 bg-white border-t flex gap-3 shrink-0">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={onDownloadPdf}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button
            className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onShare}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
