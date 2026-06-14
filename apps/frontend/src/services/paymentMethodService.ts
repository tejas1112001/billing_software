import { api } from './api';
import type { PaymentMethod } from '@/types';

export const paymentMethodService = {
  getAll: (): Promise<PaymentMethod[]> =>
    api.get('/payment-methods').then((r) => r.data),

  create: (name: string): Promise<PaymentMethod> =>
    api.post('/payment-methods', { name }).then((r) => r.data),

  update: (id: string, data: { name?: string; isActive?: boolean }): Promise<PaymentMethod> =>
    api.put(`/payment-methods/${id}`, data).then((r) => r.data),

  remove: (id: string): Promise<PaymentMethod> =>
    api.delete(`/payment-methods/${id}`).then((r) => r.data),
};
