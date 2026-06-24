import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

export async function optimizeUploadedImage(filePath: string): Promise<void> {
  const ext = path.extname(filePath).toLowerCase();
  const tempPath = `${filePath}.tmp`;

  try {
    let pipeline = sharp(filePath, { failOn: 'none' })
      .rotate()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true });

    if (ext === '.png') {
      pipeline = pipeline.png({ quality: 85, compressionLevel: 9 });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: 82 });
    } else {
      pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
    }

    await pipeline.toFile(tempPath);
    await fs.rename(tempPath, filePath);
  } catch {
    try {
      await fs.unlink(tempPath);
    } catch {
      // ignore cleanup errors
    }
  }
}

export function resolveUploadPathFromUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;

  const uploadsIndex = imageUrl.indexOf('/uploads/');
  if (uploadsIndex === -1) return null;

  const filename = imageUrl.slice(uploadsIndex + '/uploads/'.length).split('?')[0];
  if (!filename || filename.includes('..')) return null;

  return path.join(uploadDir, filename);
}

async function roundImageBuffer(buffer: Buffer, size: number, radius: number): Promise<Buffer> {
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>`
  );

  return sharp(buffer)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

export async function loadImageBuffer(
  imageUrl: string | null | undefined,
  size = 64,
  radius = 5
): Promise<Buffer | null> {
  const filePath = resolveUploadPathFromUrl(imageUrl);
  if (!filePath) return null;

  try {
    const buffer = await fs.readFile(filePath);
    const resized = await sharp(buffer)
      .rotate()
      .resize(size, size, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
    return roundImageBuffer(resized, size, radius);
  } catch {
    return null;
  }
}
