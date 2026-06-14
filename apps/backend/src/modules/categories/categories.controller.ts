import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as categoriesService from './categories.service';

const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  brandId: z.string().min(1, 'Brand is required'),
  imageUrl: z.string().url().optional().nullable(),
});
const UpdateCategorySchema = CreateCategorySchema.partial();

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await categoriesService.list(req.query);
    res.json(result);
  } catch (e) { next(e); }
}

export async function getCategoriesByBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await categoriesService.getAllByBrand(req.params.brandId);
    res.json(result);
  } catch (e) { next(e); }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateCategorySchema.parse(req.body);
    const category = await categoriesService.create(req.user!.id, body);
    res.status(201).json(category);
  } catch (e) { next(e); }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const body = UpdateCategorySchema.parse(req.body);
    const category = await categoriesService.update(req.params.id, body);
    res.json(category);
  } catch (e) { next(e); }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    await categoriesService.remove(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}
