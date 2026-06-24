import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  getDashboardStats, getOperatorStats, getPersonalStats, getPersonalActivity, getLowStockProducts,
  getWeeklyTrends, getTopProducts, getRecentActivity,
  getCashCreditReport, getPurchaseQuantityReport, getProfitReport,
  getProductReport, getProductStockHistory,
} from './dashboard.controller';

const router = Router();

router.get('/stats', authenticate, authorize('ADMIN'), getDashboardStats);
router.get('/operator-stats', authenticate, authorize('ADMIN'), getOperatorStats);
router.get('/personal-stats', authenticate, getPersonalStats);
router.get('/personal-activity', authenticate, getPersonalActivity);
router.get('/low-stock-products', authenticate, authorize('ADMIN'), getLowStockProducts);
router.get('/weekly-trends', authenticate, authorize('ADMIN'), getWeeklyTrends);
router.get('/top-products', authenticate, authorize('ADMIN'), getTopProducts);
router.get('/recent-activity', authenticate, authorize('ADMIN'), getRecentActivity);

// New report endpoints
router.get('/cash-credit-report', authenticate, authorize('ADMIN'), getCashCreditReport);
router.get('/purchase-quantity-report', authenticate, authorize('ADMIN'), getPurchaseQuantityReport);
router.get('/profit-report', authenticate, authorize('ADMIN'), getProfitReport);
router.get('/product-report', authenticate, authorize('ADMIN'), getProductReport);
router.get('/product-report/:productId/history', authenticate, authorize('ADMIN'), getProductStockHistory);

export default router;
