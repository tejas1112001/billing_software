import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Coins, CreditCard } from 'lucide-react';

interface PriceSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (priceType: 'CASH' | 'CREDIT') => void;
}

export function PriceSelectionModal({
  open,
  onOpenChange,
  onConfirm,
}: PriceSelectionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-extrabold text-center text-gray-900 dark:text-white">
            Select Pricing
          </DialogTitle>
          <DialogDescription className="text-center text-sm font-medium">
            Choose the applicable price tier for this order.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 px-1">
          <button
            className="group relative flex flex-col items-center justify-center gap-3 p-6 h-auto rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm transition-all duration-300 hover:border-yellow-400 hover:shadow-md hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 overflow-hidden"
            onClick={() => {
              onConfirm('CASH');
              onOpenChange(false);
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 p-3 bg-yellow-100/50 dark:bg-yellow-900/30 rounded-full group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/50 transition-colors duration-300">
              <Coins className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
            </div>
            <div className="relative z-10 text-center">
              <span className="block font-bold text-gray-900 dark:text-gray-100 text-lg">Gold Price</span>
              <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">Cash Payment</span>
            </div>
          </button>
          
          <button
            className="group relative flex flex-col items-center justify-center gap-3 p-6 h-auto rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm transition-all duration-300 hover:border-indigo-400 hover:shadow-md hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 overflow-hidden"
            onClick={() => {
              onConfirm('CREDIT');
              onOpenChange(false);
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 p-3 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-full group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors duration-300">
              <CreditCard className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="relative z-10 text-center">
              <span className="block font-bold text-gray-900 dark:text-gray-100 text-lg">Platinum Price</span>
              <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">Credit Payment</span>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
