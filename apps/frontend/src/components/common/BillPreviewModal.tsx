import React from 'react';
import { Download, Share2, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Order } from '@/types';

interface BillPreviewModalProps {
  order: Order | null;
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

export function BillPreviewModal({
  order,
  open,
  onClose,
  onDownloadPdf,
  onShare,
}: BillPreviewModalProps) {
  if (!order) return null;

  const store = order.store;
  const items = order.orderItems ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-full max-w-lg p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* ── Header ── */}
        <div className="bg-indigo-600 px-6 py-5 text-white shrink-0 relative">
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 text-white">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>

          {/* Success badge */}
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-300" />
            <span className="text-sm font-medium text-indigo-200">Bill Created Successfully</span>
          </div>

          {store ? (
            <>
              <h2 className="text-xl font-bold leading-tight">{store.name}</h2>
              <p className="text-sm text-indigo-200 mt-0.5">
                {store.address}, {store.city}
              </p>
              <p className="text-xs text-indigo-300 mt-0.5">
                {store.mobile} · {store.email}
              </p>
            </>
          ) : (
            <h2 className="text-xl font-bold">Tax Invoice</h2>
          )}
        </div>

        {/* ── Bill Meta ── */}
        <div className="px-6 py-3 bg-indigo-50 border-b flex flex-wrap gap-x-6 gap-y-1 shrink-0">
          <div>
            <p className="text-xs text-muted-foreground">Bill No.</p>
            <p className="text-sm font-semibold text-indigo-700">{order.billNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
          </div>
          {order.customerName && (
            <div>
              <p className="text-xs text-muted-foreground">Customer</p>
              <p className="text-sm font-medium">{order.customerName}</p>
            </div>
          )}
        </div>

        {/* ── Items Table ── */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-6">#</th>
                <th className="text-left px-2 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="text-center px-2 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">Qty</th>
                <th className="text-right px-2 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Price</th>
                <th className="text-right px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-muted-foreground text-sm">
                    No items
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                    <td className="px-6 py-3 text-xs text-muted-foreground">{idx + 1}</td>
                    <td className="px-2 py-3 font-medium text-gray-800">
                      {item.product?.modelName ?? 'N/A'}
                    </td>
                    <td className="px-2 py-3 text-center text-gray-700">{item.quantity}</td>
                    <td className="px-2 py-3 text-right text-gray-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-800">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Grand Total ── */}
        <div className="border-t shrink-0">
          <div className="flex items-center justify-between px-6 py-3 bg-indigo-600 text-white">
            <span className="text-sm font-semibold">Grand Total</span>
            <span className="text-xl font-bold">{formatCurrency(order.totalAmount)}</span>
          </div>
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
            className="flex-1 gap-2"
            onClick={onShare}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-4 text-center shrink-0">
          <p className="text-xs text-muted-foreground italic">
            Thank you for your purchase! This is a computer-generated invoice.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
