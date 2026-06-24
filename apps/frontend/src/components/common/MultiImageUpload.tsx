import React, { useRef, useState, useEffect } from 'react';
import { Upload, Camera, X, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateImageFile } from '@/utils/imageValidation';
import { resolveImageUrl } from '@/utils/imageUrl';
import { cn } from '@/lib/utils';

export interface PendingImage {
  id: string;
  file?: File;
  url: string;
  previewUrl: string;
  isExisting: boolean;
}

interface MultiImageUploadProps {
  images: PendingImage[];
  thumbnailUrl: string | null;
  onChange: (images: PendingImage[], thumbnailUrl: string | null) => void;
  disabled?: boolean;
  className?: string;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function MultiImageUpload({
  images,
  thumbnailUrl,
  onChange,
  disabled = false,
  className,
}: MultiImageUploadProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const addFiles = (files: FileList | File[]) => {
    const next = [...images];
    let nextThumbnail = thumbnailUrl;

    for (const file of Array.from(files)) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      objectUrls.current.push(previewUrl);
      const id = createId();
      next.push({ id, file, url: previewUrl, previewUrl, isExisting: false });
      if (!nextThumbnail) nextThumbnail = previewUrl;
    }

    setError(null);
    onChange(next, nextThumbnail);
  };

  const removeImage = (id: string) => {
    const next = images.filter((img) => img.id !== id);
    let nextThumbnail = thumbnailUrl;
    if (thumbnailUrl && !next.some((img) => img.url === thumbnailUrl || img.previewUrl === thumbnailUrl)) {
      nextThumbnail = next[0]?.url ?? null;
    }
    onChange(next, nextThumbnail);
  };

  const setThumbnail = (url: string) => {
    onChange(images, url);
  };

  return (
    <div className={className}>
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary transition-colors',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
        onClick={() => !disabled && galleryRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!disabled && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && galleryRef.current?.click()}
      >
        <Upload className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Click or drag to upload multiple images
          <br />
          <span className="text-xs">JPG, JPEG, PNG, WebP (max 3 MB each)</span>
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 w-full gap-2"
        onClick={() => cameraRef.current?.click()}
        disabled={disabled}
      >
        <Camera className="h-4 w-4" />
        Take Photo
      </Button>

      {error && (
        <p className="text-xs text-destructive mt-2" role="alert">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img) => {
            const preview = img.isExisting ? resolveImageUrl(img.url) : img.previewUrl;
            const isThumb = thumbnailUrl === img.url || thumbnailUrl === img.previewUrl;
            return (
              <div key={img.id} className="relative group">
                <img
                  src={preview ?? undefined}
                  alt="Product"
                  loading="lazy"
                  className={cn(
                    'w-full aspect-square object-cover rounded-md border',
                    isThumb && 'ring-2 ring-primary ring-offset-1'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setThumbnail(img.isExisting ? img.url : img.previewUrl)}
                  className={cn(
                    'absolute bottom-1 left-1 h-6 w-6 rounded-full flex items-center justify-center',
                    isThumb ? 'bg-primary text-primary-foreground' : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
                  )}
                  title="Set as thumbnail"
                  disabled={disabled}
                >
                  <Star className="h-3 w-3" />
                </button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1.5 -right-1.5 h-5 w-5"
                  onClick={() => removeImage(img.id)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {disabled && (
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Uploading images...
        </div>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
        disabled={disabled}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
        disabled={disabled}
      />
    </div>
  );
}
