import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as productsController from './products.controller';

const router = Router();

router.get('/', authenticate, productsController.listProducts);
router.post('/', authenticate, authorize('ADMIN'), productsController.createProduct);
router.put('/:id', authenticate, authorize('ADMIN'), productsController.updateProduct);
router.delete('/:id', authenticate, authorize('ADMIN'), productsController.deleteProduct);

export default router;
