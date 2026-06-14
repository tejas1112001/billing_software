import { Request, Response, NextFunction } from 'express';
import * as service from './paymentMethods.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    // Operators only see active methods; admins see all
    const activeOnly = req.user?.role !== 'ADMIN';
    res.json(await service.listPaymentMethods(activeOnly));
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Payment method name is required' });
      return;
    }
    res.status(201).json(await service.createPaymentMethod(req.user!.id, name.trim()));
  } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.updatePaymentMethod(req.user!.id, req.params.id, req.body));
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.deletePaymentMethod(req.params.id));
  } catch (e) { next(e); }
}
