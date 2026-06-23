import { Request, Response, NextFunction } from 'express';

export function getPublicBaseUrl(req: Request): string {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, '');
  }

  const forwardedProto = req.get('x-forwarded-proto');
  const forwardedHost = req.get('x-forwarded-host');
  const protocol = forwardedProto?.split(',')[0]?.trim() || req.protocol;
  const host = forwardedHost?.split(',')[0]?.trim() || req.get('host');

  return `${protocol}://${host}`;
}

export async function uploadFile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Select an image and try again.' });
      return;
    }

    const baseUrl = getPublicBaseUrl(req);
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    res.status(201).json({ url: fileUrl });
  } catch (e) {
    next(e);
  }
}
