import axios from 'axios';
import { api } from './api';

function getUploadErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    if (error.response?.status === 401) {
      return 'Your session expired. Please sign in again.';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to upload images.';
    }
    if (!error.response) {
      return 'Unable to reach the server. Check your connection and try again.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Image upload failed. Please try again.';
}

/**
 * Upload a single image file to the server.
 * Returns the public URL of the uploaded image.
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  // Do not set Content-Type manually — the browser must add the multipart boundary.
  const response = await api.post<{ url: string }>('/upload', formData);

  if (!response.data?.url) {
    throw new Error('Upload succeeded but no image URL was returned.');
  }

  return response.data.url;
}

export { getUploadErrorMessage };
