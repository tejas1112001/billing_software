import { api, downloadBlob } from './api';
export const stockReportService = {
  getReport: (params?: Record<string, unknown>) => api.get('/stock-reports', { params }).then((r) => r.data),
  exportPdf: async (params?: Record<string, unknown>) => {
    const r = await api.get('/stock-reports/export/pdf', { params, responseType: 'blob' });
    downloadBlob(r.data, 'stock-report.pdf');
  },
  exportExcel: async (params?: Record<string, unknown>) => {
    const r = await api.get('/stock-reports/export/excel', { params, responseType: 'blob' });
    downloadBlob(r.data, 'stock-report.xlsx');
  },
};
