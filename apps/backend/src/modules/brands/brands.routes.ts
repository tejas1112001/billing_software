import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as brandsController from './brands.controller';

const router = Router();

router.get('/', authenticate, brandsController.listBrands);
router.get('/all', authenticate, brandsController.getAllBrands);
router.post('/', authenticate, authorize('ADMIN'), brandsController.createBrand);
router.put('/:id', authenticate, authorize('ADMIN'), brandsController.updateBrand);
router.delete('/:id', authenticate, authorize('ADMIN'), brandsController.deleteBrand);

export default router;
