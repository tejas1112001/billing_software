import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  getDashboardStats, getOperatorStats, getPersonalStats,
  getWeeklyTrends, getTopProducts, getRecentActivity,
} from './dashboard.controller';

const router = Router();

router.get('/stats', authenticate, getDashboardStats);
router.get('/operator-stats', authenticate, authorize('ADMIN'), getOperatorStats);
router.get('/personal-stats', authenticate, getPersonalStats);
router.get('/weekly-trends', authenticate, authorize('ADMIN'), getWeeklyTrends);
router.get('/top-products', authenticate, authorize('ADMIN'), getTopProducts);
router.get('/recent-activity', authenticate, authorize('ADMIN'), getRecentActivity);

export default router;
