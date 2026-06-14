import { api } from './api';
import type { DashboardStats, OperatorStat, PersonalStats, OperatorType, WeeklyTrendDay, TopProduct, ActivityLog } from '@/types';

export const dashboardService = {
  getStats: (): Promise<DashboardStats> =>
    api.get('/dashboard/stats').then((r) => r.data),

  getOperatorStats: (operatorType?: OperatorType): Promise<{ operators: OperatorStat[]; distribution: { cashSales: number; creditSales: number } }> =>
    api.get('/dashboard/operator-stats', { params: operatorType ? { operatorType } : undefined }).then((r) => r.data),

  getPersonalStats: (): Promise<PersonalStats> =>
    api.get('/dashboard/personal-stats').then((r) => r.data),

  getWeeklyTrends: (): Promise<{ days: WeeklyTrendDay[] }> =>
    api.get('/dashboard/weekly-trends').then((r) => r.data),

  getTopProducts: (): Promise<{ products: TopProduct[] }> =>
    api.get('/dashboard/top-products').then((r) => r.data),

  getRecentActivity: (): Promise<{ logs: ActivityLog[] }> =>
    api.get('/dashboard/recent-activity').then((r) => r.data),
};
