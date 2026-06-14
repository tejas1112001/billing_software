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
      reset({ date: todayISO(), amount: undefined as unknown as number, paymentMethodId: '' });
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to save receipt';
      toast.error(msg);
    },
  });

  return (
    <div className="max-w-lg mx-auto px-2 py-4 space-y-4">
      <PageHeader title="Generate Receipt" />

      {/* Step 1: Store selection — always visible */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Store</Label>
        <StoreCombobox value={selectedStore} onChange={setSelectedStore} />
      </div>

      {/* Step 2: Receipt form — shown after store selected */}
      {selectedStore && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Receipt for <span className="text-foreground font-semibold">{selectedStore.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              {/* Payment Method */}
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
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
                  <p className="text-xs text-destructive">{errors.paymentMethodId.message}</p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" className="h-11" max={todayISO()} {...register('date')} />
                {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount Received (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="h-11 text-base"
                  {...register('amount')}
                />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>

              <Button type="submit" className="w-full h-11 text-base" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  'Save Receipt'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
