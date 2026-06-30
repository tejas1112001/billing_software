import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizePermission } from '../../middleware/authorizePermission';
import * as receiptsController from './receipts.controller';

const router = Router();

router.get('/', authenticate, authorizePermission('RECEIPTS'), receiptsController.listReceipts);
router.post('/', authenticate, authorizePermission('RECEIPTS'), receiptsController.createReceipt);
router.get('/:id/pdf', authenticate, authorizePermission('RECEIPTS'), receiptsController.downloadReceiptPdf);
router.get('/:id', authenticate, authorizePermission('RECEIPTS'), receiptsController.getReceiptById);
router.put('/:id', authenticate, authorizePermission('RECEIPTS'), receiptsController.updateReceipt);
router.delete('/:id', authenticate, receiptsController.deleteReceipt);

export default router;
