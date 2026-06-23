import { api } from './api';
import type { AppUser, PaginatedResponse, Role, OperatorType } from '@/types';

export const userService = {
  list: (params?: Record<string, unknown>): Promise<PaginatedResponse<AppUser>> =>
    api.get('/users', { params }).then((r) => r.data),

  create: (data: {
    username: string;
    password: string;
    role: Role;
    operatorType?: OperatorType;
  }): Promise<AppUser> =>
    api.post('/users', data).then((r) => r.data),

  update: (id: string, data: {
    username?: string;
    role?: Role;
    operatorType?: OperatorType | null;
    isActive?: boolean;
  }): Promise<AppUser> =>
    api.put(`/users/${id}`, data).then((r) => r.data),

  resetPassword: (id: string, password: string): Promise<{ success: boolean }> =>
    api.post(`/users/${id}/reset-password`, { password }).then((r) => r.data),

  delete: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/users/${id}`).then((r) => r.data),
};
