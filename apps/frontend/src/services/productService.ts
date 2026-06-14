import { api } from './api';
export const productService = {
  list: (params?: Record<string, unknown>) => api.get('/products', { params }).then((r) => r.data),
  create: (data: unknown) => api.post('/products', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/products/${id}`, data).then((r) => r.data),
};
