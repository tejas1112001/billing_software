import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as ordersController from './orders.controller';

const router = Router();

router.get('/', authenticate, ordersController.listOrders);
router.post('/', authenticate, ordersController.createOrder);
router.get('/:id/pdf', authenticate, ordersController.downloadOrderPdf);
router.get('/:id', authenticate, ordersController.getOrderById);
router.put('/:id', authenticate, ordersController.updateOrder);
router.patch('/:id/discount', authenticate, ordersController.applyDiscount);
router.delete('/:id', authenticate, ordersController.deleteOrder);

export default router;
