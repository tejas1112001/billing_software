import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as ordersService from './orders.service';
import { generateBillPdf } from '../../utils/pdfGenerator';
import { AppError } from '../../middleware/errorHandler';

const CreateOrderSchema = z.object({
  storeId: z.string().min(1, 'Store is required'),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1, 'At least one item required'),
});

export async function listOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ordersService.list(req.query);
    res.json(result);
  } catch (e) { next(e); }
}

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateOrderSchema.parse(req.body);
    const order = await ordersService.createOrder(
      req.user!.id,
      body.storeId,
      body.items
    );
    res.status(201).json(order);
  } catch (e) { next(e); }
}

export async function getOrderById(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.getById(req.params.id);
    if (!order) throw new AppError(404, 'Order not found');
    res.json(order);
  } catch (e) { next(e); }
}

export async function downloadOrderPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.getById(req.params.id);
    if (!order || !order.store) throw new AppError(404, 'Order not found');

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = generateBillPdf(order as unknown as Parameters<typeof generateBillPdf>[0], order.store);
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bill-${order.billNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(pdfBuffer);
  } catch (e) {
    next(e);
  }
}
