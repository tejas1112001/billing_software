import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as receiptsService from './receipts.service';
import { generateReceiptPdf } from '../../utils/pdfGenerator';
import { AppError } from '../../middleware/errorHandler';
import { resolveAccessScope } from '../../utils/accessScope';

const CreateReceiptSchema = z.object({
  storeId: z.string().min(1, 'Store is required'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
});

const UpdateReceiptSchema = z.object({
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
});

export async function listReceipts(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveAccessScope(req.user!.id, req.user!.role);
    const result = await receiptsService.list(req.query, scope);
    res.json(result);
  } catch (e) { next(e); }
}

export async function createReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateReceiptSchema.parse(req.body);
    const receipt = await receiptsService.createReceipt(
      req.user!.id,
      body.storeId,
      body.paymentMethodId,
      body.amount,
      body.date
    );
    res.status(201).json(receipt);
  } catch (e) { next(e); }
}

export async function getReceiptById(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveAccessScope(req.user!.id, req.user!.role);
    const receipt = await receiptsService.getById(req.params.id, scope);
    if (!receipt) throw new AppError(404, 'Receipt not found');
    res.json(receipt);
  } catch (e) { next(e); }
}

export async function updateReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveAccessScope(req.user!.id, req.user!.role);
    const body = UpdateReceiptSchema.parse(req.body);
    const receipt = await receiptsService.updateReceipt(
      req.params.id,
      req.user!.id,
      scope,
      { paymentMethodId: body.paymentMethodId, amount: body.amount, dateStr: body.date }
    );
    res.json(receipt);
  } catch (e) { next(e); }
}

export async function deleteReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveAccessScope(req.user!.id, req.user!.role);
    const receipt = await receiptsService.deleteReceipt(req.params.id, req.user!.id, scope);
    res.json(receipt);
  } catch (e) { next(e); }
}

export async function downloadReceiptPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveAccessScope(req.user!.id, req.user!.role);
    const receipt = await receiptsService.getById(req.params.id, scope);
    if (!receipt || !receipt.store) throw new AppError(404, 'Receipt not found');

    const pdfBuffer = await generateReceiptPdf(receipt as unknown as Parameters<typeof generateReceiptPdf>[0]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${receipt.receiptNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(pdfBuffer);
  } catch (e) {
    next(e);
  }
}
