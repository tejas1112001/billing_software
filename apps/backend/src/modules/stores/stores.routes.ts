import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as storesController from './stores.controller';

const router = Router();

router.get('/', authenticate, storesController.listStores);
router.get('/all', authenticate, storesController.getAllStores);
router.post('/', authenticate, authorize('ADMIN'), storesController.createStore);
router.put('/:id', authenticate, authorize('ADMIN'), storesController.updateStore);
router.delete('/:id', authenticate, authorize('ADMIN'), storesController.deleteStore);

export default router;
