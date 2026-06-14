import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as receiptsController from './receipts.controller';

const router = Router();

router.get('/', authenticate, receiptsController.listReceipts);
router.post('/', authenticate, receiptsController.createReceipt);
router.get('/:id', authenticate, receiptsController.getReceiptById);

export default router;
