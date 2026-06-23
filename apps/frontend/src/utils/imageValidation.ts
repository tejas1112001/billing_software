export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function getExtension(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.[^.]+$/);
  return match?.[0] ?? '';
}

export function validateImageFile(file: File): string | null {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return `Image must be 5 MB or smaller (selected: ${sizeMb} MB)`;
  }

  const extension = getExtension(file.name);
  const mimeOk = !file.type || ALLOWED_MIME_TYPES.has(file.type);
  const extOk = ALLOWED_EXTENSIONS.has(extension);

  // Mobile camera captures may omit MIME type but still provide a valid extension.
  if (mimeOk && (extOk || !extension)) {
    return null;
  }

  if (ALLOWED_MIME_TYPES.has(file.type) || extOk) {
    return null;
  }

  return 'Only JPG, JPEG, PNG, and WebP images are supported';
}
