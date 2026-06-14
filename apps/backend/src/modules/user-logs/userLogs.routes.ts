import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { listUserLogs } from './userLogs.controller';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), listUserLogs);

export default router;
