import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as stockReportController from './stockReport.controller';

const router = Router();

router.get('/', authenticate, stockReportController.getReport);
router.get('/export/pdf', authenticate, stockReportController.exportPdf);
router.get('/export/excel', authenticate, stockReportController.exportExcel);

export default router;
