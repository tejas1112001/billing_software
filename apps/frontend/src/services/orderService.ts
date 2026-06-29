import { api, downloadBlob } from './api';

export const orderService = {
  list: (params?: Record<string, unknown>) => api.get('/orders', { params }).then((r) => r.data),
  create: (data: { storeId: string; items: Array<{ productId: string; quantity: number }>; priceType?: 'CASH' | 'CREDIT' }) =>
    api.post('/orders', data).then((r) => r.data),
  getById: (id: string) => api.get(`/orders/${id}`).then((r) => r.data),
  update: (id: string, data: { items: Array<{ productId: string; quantity: number }> }) =>
    api.put(`/orders/${id}`, data).then((r) => r.data),
  applyDiscount: (id: string, data: { discountType: 'PERCENTAGE' | 'FIXED'; discountValue: number }) =>
    api.patch(`/orders/${id}/discount`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/orders/${id}`).then((r) => r.data),
  downloadPdf: async (orderId: string, billNumber: string) => {
    const response = await api.get(`/orders/${orderId}/pdf`, { responseType: 'blob' });
    downloadBlob(response.data, `bill-${billNumber}.pdf`);
  },
};

