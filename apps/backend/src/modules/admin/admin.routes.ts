import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as adminController from './admin.controller';

const router = Router();

// Only ADMIN users can reset data
router.post('/reset-data', authenticate, authorize('ADMIN'), adminController.resetData);

export default router;
