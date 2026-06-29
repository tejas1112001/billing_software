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
import { getProductDisplayName } from '@/utils/productName';
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

        {/* ── Header — clean dark navy ── */}
        <div className="px-6 py-5 text-white shrink-0 relative" style={{ background: '#1E3A5F' }}>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 text-white">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>

          {/* Success badge */}
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <span className="text-xs font-medium" style={{ color: '#A8C4DE' }}>Bill Created Successfully</span>
          </div>

          {store ? (
            <>
              <h2 className="text-xl font-bold leading-tight tracking-tight">{store.name}</h2>
              <p className="text-sm mt-0.5" style={{ color: '#A8C4DE' }}>
                {store.address}, {store.city}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#7FA8C9' }}>
                {store.mobile} · {store.email}
              </p>
            </>
          ) : (
            <h2 className="text-xl font-bold">Tax Invoice</h2>
          )}

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#2D5A8E' }} />
        </div>

        {/* ── Bill Meta — clean white cards ── */}
        <div className="px-5 py-3 bg-white border-b flex flex-wrap gap-x-6 gap-y-2 shrink-0">
          <div className="border-l-2 pl-3" style={{ borderColor: '#1E3A5F' }}>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">Bill No.</p>
            <p className="text-sm font-bold text-gray-800">{order.billNumber}</p>
          </div>
          <div className="border-l-2 pl-3" style={{ borderColor: '#1E3A5F' }}>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">Date</p>
            <p className="text-sm font-medium text-gray-700">{formatDate(order.createdAt)}</p>
          </div>
          {order.user?.username && (
            <div className="border-l-2 pl-3" style={{ borderColor: '#1E3A5F' }}>
              <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">Salesperson</p>
              <p className="text-sm font-medium text-gray-700">{order.user.username}</p>
            </div>
          )}
          {order.customerName && (
            <div className="border-l-2 pl-3" style={{ borderColor: '#1E3A5F' }}>
              <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">Customer</p>
              <p className="text-sm font-medium text-gray-700">{order.customerName}</p>
            </div>
          )}
        </div>

        {/* ── Items Table ── */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b" style={{ background: '#2C3E50' }}>
              <tr>
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-gray-300 uppercase tracking-wider w-6">#</th>
                <th className="text-left px-2 py-2.5 text-[11px] font-semibold text-gray-300 uppercase tracking-wider">Product</th>
                <th className="text-center px-2 py-2.5 text-[11px] font-semibold text-gray-300 uppercase tracking-wider w-12">Qty</th>
                <th className="text-right px-2 py-2.5 text-[11px] font-semibold text-gray-300 uppercase tracking-wider w-24">Price</th>
                <th className="text-right px-5 py-2.5 text-[11px] font-semibold text-gray-300 uppercase tracking-wider w-24">Total</th>
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
                  <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                    <td className="px-5 py-3 text-xs text-gray-400">{idx + 1}</td>
                    <td className="px-2 py-3">
                      <p className="font-medium text-gray-800 text-sm">{getProductDisplayName(item.product)}</p>
                    </td>
                    <td className="px-2 py-3 text-center text-gray-600 font-medium">{item.quantity}</td>
                    <td className="px-2 py-3 text-right text-gray-500 text-sm">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-800">
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
          {/* Subtotal + Discount rows (only when discount is applied) */}
          {order.discountType && order.discountValue != null && Number(order.discountValue) > 0 && (() => {
            const itemsSubtotal = (order.orderItems ?? []).reduce(
              (sum, item) => sum + Number(item.lineTotal), 0
            );
            const discVal = Number(order.discountValue);
            const discountAmount =
              order.discountType === 'PERCENTAGE'
                ? (itemsSubtotal * discVal) / 100
                : discVal;
            const discLabel =
              order.discountType === 'PERCENTAGE'
                ? `${discVal}% off`
                : `Rs. ${formatCurrency(discVal)} off`;

            return (
              <>
                <div className="flex items-center justify-between px-5 py-2 bg-gray-50 border-b">
                  <span className="text-xs text-gray-500 font-medium">Subtotal</span>
                  <span className="text-sm font-medium text-gray-700">{formatCurrency(itemsSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-amber-100" style={{ background: '#FFFBEB' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-amber-800">Discount ({discLabel})</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-amber-700">- {formatCurrency(discountAmount)}</span>
                </div>
              </>
            );
          })()}

          {/* Grand total — clean dark navy, no purple */}
          <div className="flex items-center justify-between px-5 py-3 text-white" style={{ background: '#1E3A5F' }}>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#90B4CE' }}>
              {order.discountType && Number(order.discountValue) > 0 ? 'Final Payable Amount' : 'Grand Total'}
            </span>
            <span className="text-xl font-bold">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="px-5 py-3 bg-white border-t flex gap-3 shrink-0">
          <Button
            variant="outline"
            className="flex-1 gap-2 text-sm h-9"
            onClick={onDownloadPdf}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button
            className="flex-1 gap-2 text-sm h-9 text-white"
            style={{ background: '#1E3A5F' }}
            onClick={onShare}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-3 text-center shrink-0">
          <p className="text-xs text-gray-400 italic">
            Thank you for your purchase! This is a computer-generated invoice.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
