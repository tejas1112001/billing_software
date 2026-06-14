import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { uploadImage } from '../../middleware/upload';
import { uploadFile } from './upload.controller';

const router = Router();

// POST /api/upload — upload a single image, returns { url }
router.post('/', authenticate, authorize('ADMIN'), (req, res, next) => {
  uploadImage(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
}, uploadFile);

export default router;
