import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as ledgerService from './ledger.service';
import { generateLedgerPdf } from '../../utils/pdfGenerator';
import { generateLedgerExcel } from '../../utils/excelGenerator';

const OpeningBalanceSchema = z.object({
  storeId: z.string().min(1),
  amount: z.number().min(0),
});

export async function getLedger(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ledgerService.getLedger(req.params.storeId, req.query);
    res.json(result);
  } catch (e) { next(e); }
}

export async function upsertOpeningBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const body = OpeningBalanceSchema.parse(req.body);
    const result = await ledgerService.upsertOpeningBalance(body.storeId, body.amount);
    res.json(result);
  } catch (e) { next(e); }
}

export async function exportLedgerPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ledgerService.getLedger(req.params.storeId, { ...req.query, pageSize: '100000', page: '1' } as any);
    const doc = generateLedgerPdf(
      req.params.storeId,
      result.data as unknown as Parameters<typeof generateLedgerPdf>[1],
      result.openingBalance,
      { from: String(req.query.dateFrom || ''), to: String(req.query.dateTo || '') }
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ledger-${req.params.storeId}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (e) { next(e); }
}

export async function exportLedgerExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ledgerService.getLedger(req.params.storeId, { ...req.query, pageSize: '100000', page: '1' } as any);
    const buffer = await generateLedgerExcel(result.data as unknown as Parameters<typeof generateLedgerExcel>[0], result.openingBalance);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ledger-${req.params.storeId}.xlsx"`);
    res.send(buffer);
  } catch (e) { next(e); }
}
