import { api, downloadBlob } from './api';

export const receiptService = {
  list: (params?: Record<string, unknown>) => api.get('/receipts', { params }).then((r) => r.data),
  create: (data: { storeId: string; paymentMethodId: string; amount: number; date: string }) =>
    api.post('/receipts', data).then((r) => r.data),
  getById: (id: string) => api.get(`/receipts/${id}`).then((r) => r.data),
  update: (id: string, data: { paymentMethodId: string; amount: number; date: string }) =>
    api.put(`/receipts/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/receipts/${id}`).then((r) => r.data),
  downloadPdf: async (receiptId: string, receiptNumber: string) => {
    const response = await api.get(`/receipts/${receiptId}/pdf`, { responseType: 'blob' });
    downloadBlob(response.data, `receipt-${receiptNumber}.pdf`);
  },
};
