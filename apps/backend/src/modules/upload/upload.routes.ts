import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { uploadImage } from '../../middleware/upload';
import { uploadFile } from './upload.controller';

const router = Router();

function handleUploadError(err: unknown): { status: number; message: string } {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return { status: 400, message: 'Image must be 5 MB or smaller' };
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return { status: 400, message: 'Unexpected upload field. Use a single image file.' };
    }
    return { status: 400, message: err.message };
  }

  if (err instanceof Error && err.message) {
    return { status: 400, message: err.message };
  }

  return { status: 400, message: 'Image upload failed' };
}

// POST /api/upload — upload a single image, returns { url }
router.post('/', authenticate, authorize('ADMIN'), (req, res, next) => {
  uploadImage(req, res, (err) => {
    if (err) {
      const { status, message } = handleUploadError(err);
      res.status(status).json({ error: message });
      return;
    }
    next();
  });
}, uploadFile);

export default router;
