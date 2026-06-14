import { api } from './api';

export const brandService = {
  list: (params?: Record<string, unknown>) => api.get('/brands', { params }).then((r) => r.data),
  getAll: () => api.get('/brands/all').then((r) => r.data),
  create: (data: unknown) => api.post('/brands', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/brands/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/brands/${id}`).then((r) => r.data),
};
