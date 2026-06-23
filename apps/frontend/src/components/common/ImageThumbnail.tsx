import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveImageUrl } from '@/utils/imageUrl';

interface ImageThumbnailProps {
  src?: string | null;
  alt: string;
  className?: string;
  size?: 'sm' | 'md';
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
};

export function ImageThumbnail({ src, alt, className, size = 'sm' }: ImageThumbnailProps) {
  const dimension = sizeClasses[size];
  const resolvedSrc = resolveImageUrl(src);

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={alt}
        className={cn(dimension, 'object-cover rounded flex-shrink-0', className)}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={cn(
        dimension,
        'rounded bg-muted flex items-center justify-center flex-shrink-0',
        className
      )}
      title="No image"
      aria-label="No image"
    >
      <ImageOff className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
