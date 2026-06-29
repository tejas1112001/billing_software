import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as ordersService from './orders.service';
import { generateBillPdf } from '../../utils/pdfGenerator';
import { AppError } from '../../middleware/errorHandler';
import { resolveAccessScope } from '../../utils/accessScope';

const OrderItemsSchema = z.array(
  z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
  })
).min(1, 'At least one item required');

const CreateOrderSchema = z.object({
  storeId: z.string().min(1, 'Store is required'),
  items: OrderItemsSchema,
  priceType: z.enum(['CASH', 'CREDIT']).optional(),
});

const UpdateOrderSchema = z.object({
  items: OrderItemsSchema,
});

const ApplyDiscountSchema = z.object({
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
});

export async function listOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveAccessScope(req.user!.id, req.user!.role);
    const result = await ordersService.list(req.query, scope);
    res.json(result);
  } catch (e) { next(e); }
}

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateOrderSchema.parse(req.body);
    const order = await ordersService.createOrder(req.user!.id, body.storeId, body.items, body.priceType);
    res.status(201).json(order);
  } catch (e) { next(e); }
}

export async function updateOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveAccessScope(req.user!.id, req.user!.role);
    const body = UpdateOrderSchema.parse(req.body);
    const order = await ordersService.updateOrder(req.params.id, req.user!.id, body.items, scope);
    res.json(order);
  } catch (e) { next(e); }
}

export async function deleteOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveAccessScope(req.user!.id, req.user!.role);
    const order = await ordersService.deleteOrder(req.params.id, req.user!.id, scope);
    res.json(order);
  } catch (e) { next(e); }
}

export async function getOrderById(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveAccessScope(req.user!.id, req.user!.role);
    const order = await ordersService.getById(req.params.id, scope);
    if (!order) throw new AppError(404, 'Order not found');
    res.json(order);
  } catch (e) { next(e); }
}

export async function downloadOrderPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveAccessScope(req.user!.id, req.user!.role);
    const order = await ordersService.getByIdForPdf(req.params.id, scope);
    if (!order.store) throw new AppError(404, 'Order not found');

    const pdfBuffer = await generateBillPdf(
      order as unknown as Parameters<typeof generateBillPdf>[0],
      order.store
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bill-${order.billNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(pdfBuffer);
  } catch (e) {
    next(e);
  }
}

export async function applyDiscount(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user!.role !== 'ADMIN') {
      throw new AppError(403, 'Only Admin can apply discounts');
    }
    const body = ApplyDiscountSchema.parse(req.body);
    const order = await ordersService.applyDiscount(
      req.params.id,
      req.user!.id,
      req.user!.role,
      body.discountType,
      body.discountValue
    );
    res.json(order);
  } catch (e) { next(e); }
}
