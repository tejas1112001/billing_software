import { api } from './api';
export const userLogService = {
  list: (params?: Record<string, unknown>) => api.get('/user-logs', { params }).then((r) => r.data),
};
