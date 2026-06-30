import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizePermission } from '../../middleware/authorizePermission';
import * as ordersController from './orders.controller';

const router = Router();

router.get('/', authenticate, authorizePermission('BILLING'), ordersController.listOrders);
router.post('/', authenticate, authorizePermission('BILLING'), ordersController.createOrder);
router.get('/:id/pdf', authenticate, authorizePermission('BILLING'), ordersController.downloadOrderPdf);
router.get('/:id', authenticate, authorizePermission('BILLING'), ordersController.getOrderById);
router.put('/:id', authenticate, authorizePermission('BILLING'), ordersController.updateOrder);
router.patch('/:id/discount', authenticate, ordersController.applyDiscount);
router.delete('/:id', authenticate, ordersController.deleteOrder);

export default router;
