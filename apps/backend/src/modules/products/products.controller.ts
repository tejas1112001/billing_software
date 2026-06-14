import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as productsService from './products.service';

const CreateProductSchema = z.object({
  modelName: z.string().min(1, 'Model name is required'),
  brandId: z.string().min(1, 'Brand is required'),
  categoryId: z.string().min(1, 'Category is required'),
  imageUrl: z.string().url().optional().nullable(),
  mrp: z.number().positive('MRP must be positive'),
  nlc: z.number().positive('NLC must be positive'),
  availableQty: z.number().int().min(0, 'Quantity cannot be negative'),
});
const UpdateProductSchema = CreateProductSchema.partial();

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productsService.list(req.query);
    res.json(result);
  } catch (e) { next(e); }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateProductSchema.parse(req.body);
    const product = await productsService.create(req.user!.id, body);
    res.status(201).json(product);
  } catch (e) { next(e); }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const body = UpdateProductSchema.parse(req.body);
    const product = await productsService.update(req.params.id, req.user!.id, body);
    res.json(product);
  } catch (e) { next(e); }
}
