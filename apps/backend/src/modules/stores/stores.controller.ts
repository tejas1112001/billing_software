import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as storesService from './stores.service';

const CreateStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  pincode: z.string().min(1, 'Pincode is required'),
  mobile: z.string().min(10, 'Valid mobile number is required'),
  email: z.string().email('Valid email is required'),
});
const UpdateStoreSchema = CreateStoreSchema.partial();

export async function listStores(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await storesService.list(req.query);
    res.json(result);
  } catch (e) { next(e); }
}

export async function getAllStores(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await storesService.getAll();
    res.json(result);
  } catch (e) { next(e); }
}

export async function createStore(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateStoreSchema.parse(req.body);
    const store = await storesService.create(req.user!.id, body);
    res.status(201).json(store);
  } catch (e) { next(e); }
}

export async function updateStore(req: Request, res: Response, next: NextFunction) {
  try {
    const body = UpdateStoreSchema.parse(req.body);
    const store = await storesService.update(req.params.id, body);
    res.json(store);
  } catch (e) { next(e); }
}

export async function deleteStore(req: Request, res: Response, next: NextFunction) {
  try {
    await storesService.remove(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}
