import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as brandsService from './brands.service';

const CreateBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  imageUrl: z.string().optional().nullable().transform(v => (!v || v.trim() === '' || v.startsWith('blob:')) ? null : v),
});

const UpdateBrandSchema = CreateBrandSchema.partial();

export async function listBrands(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await brandsService.list(req.query);
    res.json(result);
  } catch (e) { next(e); }
}

export async function getAllBrands(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await brandsService.getAll();
    res.json(result);
  } catch (e) { next(e); }
}

export async function createBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateBrandSchema.parse(req.body);
    const brand = await brandsService.create(req.user!.id, body);
    res.status(201).json(brand);
  } catch (e) { next(e); }
}

export async function updateBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const body = UpdateBrandSchema.parse(req.body);
    const brand = await brandsService.update(req.params.id, body);
    res.json(brand);
  } catch (e) { next(e); }
}

export async function deleteBrand(req: Request, res: Response, next: NextFunction) {
  try {
    await brandsService.remove(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}
