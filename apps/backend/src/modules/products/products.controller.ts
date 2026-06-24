import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as productsService from './products.service';

const imageUrlTransform = z
  .string()
  .nullable()
  .optional()
  .transform((val) => {
    if (!val || val.trim() === '' || val.startsWith('blob:')) return null;
    return val;
  });

const CreateProductSchema = z.object({
  modelName: z.string().min(1, 'Model name is required'),
  brandId: z.string().min(1, 'Brand is required'),
  categoryId: z.string().min(1, 'Category is required'),
  imageUrl: imageUrlTransform,
  images: z.array(z.string()).optional(),
  thumbnailUrl: imageUrlTransform,
  mrp: z.coerce.number().positive('MRP must be positive'),
  cashPrice: z.coerce.number().positive('Cash price must be positive'),
  creditPrice: z.coerce.number().positive('Credit price must be positive'),
  purchasePrice: z
    .union([
      z.coerce.number().positive('Purchase price must be positive'),
      z.coerce.number().refine((val) => val === 0, 'Purchase price must be positive or 0'),
    ])
    .optional()
    .nullable(),
  availableQty: z.coerce.number().int().min(0, 'Quantity cannot be negative'),
  isNewArrival: z.coerce.boolean().optional(),
});
const UpdateProductSchema = CreateProductSchema.partial();

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productsService.list(req.query);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateProductSchema.parse(req.body);
    const product = await productsService.create(req.user!.id, body);
    res.status(201).json(product);
  } catch (e) {
    next(e);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const body = UpdateProductSchema.parse(req.body);
    const product = await productsService.update(req.params.id, req.user!.id, body);
    res.json(product);
  } catch (e) {
    next(e);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productsService.deleteProduct(req.params.id, req.user!.id);
    res.json(product);
  } catch (e) {
    next(e);
  }
}
