import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ledgerController from './ledger.controller';

const router = Router();

router.get('/:storeId', authenticate, ledgerController.getLedger);
router.get('/:storeId/export/pdf', authenticate, ledgerController.exportLedgerPdf);
router.get('/:storeId/export/excel', authenticate, ledgerController.exportLedgerExcel);
router.post('/opening-balance', authenticate, authorize('ADMIN'), ledgerController.upsertOpeningBalance);

export default router;
