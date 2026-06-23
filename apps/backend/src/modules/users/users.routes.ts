import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ctrl from './users.controller';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), ctrl.list);
router.post('/', authenticate, authorize('ADMIN'), ctrl.create);
router.put('/:id', authenticate, authorize('ADMIN'), ctrl.update);
router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.deleteUser);
router.post('/:id/reset-password', authenticate, authorize('ADMIN'), ctrl.resetPassword);

export default router;
