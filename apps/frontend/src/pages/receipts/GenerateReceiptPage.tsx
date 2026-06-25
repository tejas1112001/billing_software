import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StoreCombobox } from '@/components/common/StoreCombobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { receiptService } from '@/services/receiptService';
import { paymentMethodService } from '@/services/paymentMethodService';
import { todayISO } from '@/utils/formatDate';
import type { Store, PaymentMethod } from '@/types';

const schema = z.object({
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required').refine(
    (val) => val <= todayISO(),
    'Date cannot be in the future'
  ),
});

type FormData = z.infer<typeof schema>;

export default function GenerateReceiptPage() {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const { data: paymentMethods = [], isLoading: loadingMethods } = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods'],
    queryFn: () => paymentMethodService.getAll(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: todayISO() },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      receiptService.create({ ...data, storeId: selectedStore!.id }),
    onSuccess: (receipt: { receiptNumber: string }) => {
      toast.success(`Receipt ${receipt.receiptNumber} saved!`);
      reset({ date: todayISO(), amount: '' as unknown as number, paymentMethodId: '' });
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to save receipt';
      toast.error(msg);
    },
  });

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6 flex flex-col justify-center min-h-[70vh]">
      <Card className="shadow-lg border rounded-2xl overflow-hidden p-6 bg-white space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Generate Receipt</h1>
          <p className="text-sm text-muted-foreground">Select a store and record the payment details below.</p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Store</Label>
          <StoreCombobox value={selectedStore} onChange={setSelectedStore} />
        </div>

        {selectedStore && (
          <div className="space-y-4 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">
              Payment Details for {selectedStore.name}
            </p>
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              {/* Payment Method */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Payment Method</Label>
                {loadingMethods ? (
                  <div className="h-10 bg-muted animate-pulse rounded-md" />
                ) : (
                  <Select
                    value={watch('paymentMethodId')}
                    onValueChange={(v) => setValue('paymentMethodId', v, { shouldValidate: true })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods
                        .filter((pm) => pm.isActive)
                        .map((pm) => (
                          <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.paymentMethodId && (
                  <p className="text-xs text-destructive mt-0.5">{errors.paymentMethodId.message}</p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs font-medium">Date</Label>
                <Input id="date" type="date" className="h-11" max={todayISO()} {...register('date')} />
                {errors.date && <p className="text-xs text-destructive mt-0.5">{errors.date.message}</p>}
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs font-medium">Amount Received (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="h-11 text-base"
                  {...register('amount')}
                />
                {errors.amount && <p className="text-xs text-destructive mt-0.5">{errors.amount.message}</p>}
              </div>

              <Button type="submit" className="w-full h-11 text-base shadow-sm font-semibold mt-2" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  'Save Receipt'
                )}
              </Button>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}
