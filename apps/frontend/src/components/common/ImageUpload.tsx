import React, { useRef, useState, useEffect } from 'react';
import { Upload, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  value?: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file, url);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const remove = () => {
    setPreview(null);
    onChange(null, null);
  };

  if (preview) {
    return (
      <div className={className}>
        <div className="relative w-32 h-32">
          <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-md border" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={remove}
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Tap × to replace image</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Drag-and-drop zone */}
      <div
        className="border-2 border-dashed rounded-md p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary transition-colors"
        onClick={() => galleryRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && galleryRef.current?.click()}
        aria-label="Upload image from gallery"
      >
        <Upload className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Click or drag to upload
          <br />
          <span className="text-xs">JPG, PNG, WebP (max 5 MB)</span>
        </p>
      </div>

      {/* Camera button — visible when device supports capture */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 w-full gap-2"
        onClick={() => cameraRef.current?.click()}
      >
        <Camera className="h-4 w-4" />
        Take Photo
      </Button>

      {/* Hidden gallery input */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      {/* Hidden camera input — capture="environment" opens rear camera on mobile */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
