import React, { useRef, useState, useEffect } from 'react';
import { Upload, Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateImageFile } from '@/utils/imageValidation';
import { resolveImageUrl } from '@/utils/imageUrl';
import { compressImage } from '@/utils/imageCompression';

interface ImageUploadProps {
  value?: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, className, disabled = false }: ImageUploadProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const previewObjectUrl = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const isPending = disabled || isCompressing;

  useEffect(() => {
    setPreview(value ? resolveImageUrl(value) : null);
  }, [value]);

  useEffect(() => {
    return () => {
      if (previewObjectUrl.current) {
        URL.revokeObjectURL(previewObjectUrl.current);
      }
    };
  }, []);

  const clearPreviewObjectUrl = () => {
    if (previewObjectUrl.current) {
      URL.revokeObjectURL(previewObjectUrl.current);
      previewObjectUrl.current = null;
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setIsCompressing(true);

    try {
      const processedFile = await compressImage(file);
      const validationError = validateImageFile(processedFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      clearPreviewObjectUrl();

      const url = URL.createObjectURL(processedFile);
      previewObjectUrl.current = url;
      setPreview(url);
      onChange(processedFile, url);
    } catch (err) {
      console.error('Image compression failed, using original file:', err);
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      clearPreviewObjectUrl();

      const url = URL.createObjectURL(file);
      previewObjectUrl.current = url;
      setPreview(url);
      onChange(file, url);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isPending) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const remove = () => {
    clearPreviewObjectUrl();
    setPreview(null);
    setError(null);
    onChange(null, null);
  };

  if (preview) {
    return (
      <div className={className}>
        <div className="relative w-32 h-32">
          <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-md border" />
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/70">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={remove}
            disabled={isPending}
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isCompressing 
            ? 'Optimizing image...' 
            : disabled 
              ? 'Uploading image...' 
              : 'Tap × to replace image'}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className="border-2 border-dashed rounded-md p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => !isPending && galleryRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        role="button"
        tabIndex={isPending ? -1 : 0}
        onKeyDown={(e) => e.key === 'Enter' && !isPending && galleryRef.current?.click()}
        aria-label="Upload image from gallery"
        aria-disabled={isPending}
      >
        <Upload className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Click or drag to upload
          <br />
          <span className="text-xs">JPG, JPEG, PNG, WebP (max 10 MB)</span>
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 w-full gap-2"
        onClick={() => cameraRef.current?.click()}
        disabled={isPending}
      >
        {isCompressing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        {isCompressing ? 'Optimizing...' : 'Take Photo'}
      </Button>

      {error && (
        <p className="text-xs text-destructive mt-2" role="alert">
          {error}
        </p>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={isPending}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        disabled={isPending}
      />
    </div>
  );
}
