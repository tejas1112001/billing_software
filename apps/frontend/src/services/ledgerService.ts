import { api, downloadBlob } from './api';
export const ledgerService = {
  getLedger: (storeId: string, params?: Record<string, unknown>) =>
    api.get(`/ledger/${storeId}`, { params }).then((r) => r.data),
  getClosingBalance: (storeId: string) =>
    api.get(`/ledger/${storeId}/balance`).then((r) => r.data),
  upsertOpeningBalance: (data: { storeId: string; amount: number }) =>
    api.post('/ledger/opening-balance', data).then((r) => r.data),
  exportPdf: async (storeId: string, params?: Record<string, unknown>) => {
    const r = await api.get(`/ledger/${storeId}/export/pdf`, { params, responseType: 'blob' });
    downloadBlob(r.data, `ledger-${storeId}.pdf`);
  },
  exportExcel: async (storeId: string, params?: Record<string, unknown>) => {
    const r = await api.get(`/ledger/${storeId}/export/excel`, { params, responseType: 'blob' });
    downloadBlob(r.data, `ledger-${storeId}.xlsx`);
  },
};
