import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as receiptsService from './receipts.service';
import { AppError } from '../../middleware/errorHandler';

const CreateReceiptSchema = z.object({
  storeId: z.string().min(1, 'Store is required'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
});

export async function listReceipts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await receiptsService.list(req.query);
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
    const receipt = await receiptsService.getById(req.params.id);
    if (!receipt) throw new AppError(404, 'Receipt not found');
    res.json(receipt);
  } catch (e) { next(e); }
}
