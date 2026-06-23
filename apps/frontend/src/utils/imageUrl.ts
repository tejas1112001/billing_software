export function getApiOrigin(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
  return apiBase.replace(/\/api\/?$/, '');
}

/**
 * Resolve stored image URLs against the current API origin.
 * Fixes legacy records that were saved with a wrong BASE_URL in production.
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;

  const uploadsPathIndex = url.indexOf('/uploads/');
  if (uploadsPathIndex !== -1) {
    return `${getApiOrigin()}${url.slice(uploadsPathIndex)}`;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `${getApiOrigin()}${url.startsWith('/') ? url : `/${url}`}`;
}
