import { api } from './api';

export const storeService = {
  list: (params?: Record<string, unknown>) => api.get('/stores', { params }).then((r) => r.data),
  getAll: () => api.get('/stores/all').then((r) => r.data),
  create: (data: unknown) => api.post('/stores', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/stores/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/stores/${id}`).then((r) => r.data),
};
