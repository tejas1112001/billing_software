import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as categoriesController from './categories.controller';

const router = Router();

router.get('/', authenticate, categoriesController.listCategories);
router.get('/all', authenticate, categoriesController.getAllCategories);
router.get('/brand/:brandId', authenticate, categoriesController.getCategoriesByBrand);
router.post('/', authenticate, authorize('ADMIN'), categoriesController.createCategory);
router.put('/:id', authenticate, authorize('ADMIN'), categoriesController.updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), categoriesController.deleteCategory);

export default router;
