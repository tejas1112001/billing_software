import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { authorizePermission } from '../../middleware/authorizePermission';
import * as ledgerController from './ledger.controller';

const router = Router();

router.get('/:storeId', authenticate, authorizePermission('LEDGER'), ledgerController.getLedger);
router.get('/:storeId/balance', authenticate, authorizePermission('LEDGER'), ledgerController.getClosingBalance);
router.get('/:storeId/export/pdf', authenticate, authorizePermission('LEDGER'), ledgerController.exportLedgerPdf);
router.get('/:storeId/export/excel', authenticate, authorizePermission('LEDGER'), ledgerController.exportLedgerExcel);
router.post('/opening-balance', authenticate, authorize('ADMIN'), ledgerController.upsertOpeningBalance);

export default router;
