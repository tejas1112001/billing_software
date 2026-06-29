import { api } from './api';

export const categoryService = {
  list: (params?: Record<string, unknown>) => api.get('/categories', { params }).then((r) => r.data),
  getAll: () => api.get('/categories/all').then((r) => r.data),
  getByBrand: (brandId: string) => api.get(`/categories/brand/${brandId}`).then((r) => r.data),
  create: (data: unknown) => api.post('/categories', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/categories/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/categories/${id}`).then((r) => r.data),
};
