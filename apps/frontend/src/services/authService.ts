import { api } from './api';

export interface LoginPayload {
  username: string;
  password: string;
}

export const authService = {
  login: (data: LoginPayload) => api.post('/auth/login', data).then((r) => r.data),
  refresh: () => api.post('/auth/refresh').then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
};
