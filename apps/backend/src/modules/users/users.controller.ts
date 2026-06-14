import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as service from './users.service';
import { Role, OperatorType } from '@prisma/client';

const createSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'OPERATOR']),
  operatorType: z.enum(['CASH', 'CREDIT']).optional(),
});

const updateSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  role: z.enum(['ADMIN', 'OPERATOR']).optional(),
  operatorType: z.enum(['CASH', 'CREDIT']).nullable().optional(),
  isActive: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6),
});

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listUsers(req.query));
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const { username, password, role, operatorType } = parsed.data;
    res.status(201).json(
      await service.createUser(req.user!.id, username, password, role as Role, operatorType as OperatorType | undefined)
    );
  } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    res.json(await service.updateUser(req.user!.id, req.params.id, parsed.data as Parameters<typeof service.updateUser>[2]));
  } catch (e) { next(e); }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }
    res.json(await service.resetPassword(req.user!.id, req.params.id, parsed.data.password));
  } catch (e) { next(e); }
}
