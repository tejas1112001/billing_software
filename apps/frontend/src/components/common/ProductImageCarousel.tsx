import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveImageUrl } from '@/utils/imageUrl';

const AUTO_INTERVAL_MS = 2500;

interface ProductImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
}

export function ProductImageCarousel({
  images,
  alt,
  className,
  imageClassName,
}: ProductImageCarouselProps) {
  const resolved = images.map((url) => resolveImageUrl(url)).filter(Boolean) as string[];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const goTo = useCallback(
    (next: number) => {
      if (resolved.length <= 1) return;
      setIndex((next + resolved.length) % resolved.length);
    },
    [resolved.length]
  );

  const goPrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      goTo(index - 1);
    },
    [goTo, index]
  );

  const goNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      goTo(index + 1);
    },
    [goTo, index]
  );

  useEffect(() => {
    setIndex(0);
  }, [resolved.join('|')]);

  useEffect(() => {
    if (resolved.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % resolved.length);
    }, AUTO_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [resolved.length, paused, resolved.join('|')]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    setPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const onTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 40) {
      if (touchDeltaX.current < 0) goNext();
      else goPrev();
    }
    window.setTimeout(() => setPaused(false), 1200);
  };

  if (resolved.length === 0) {
    return (
      <div className={cn('w-full h-full flex items-center justify-center bg-muted', className)}>
        <Package className="h-10 w-10 text-muted-foreground" />
      </div>
    );
  }

  if (resolved.length === 1) {
    return (
      <div className={cn('relative w-full h-full bg-muted overflow-hidden', className)}>
        <img
          src={resolved[0]}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn('w-full h-full object-cover', imageClassName)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn('relative w-full h-full bg-muted overflow-hidden group select-none', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {resolved.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt={i === index ? alt : `${alt} ${i + 1}`}
          loading={i === 0 ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out',
            i === index ? 'opacity-100 z-10' : 'opacity-0 z-0',
            imageClassName
          )}
        />
      ))}

      <button
        type="button"
        onClick={goPrev}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/45 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={goNext}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/45 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20"
        aria-label="Next image"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
        {resolved.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIndex(i);
              setPaused(true);
              window.setTimeout(() => setPaused(false), 2000);
            }}
            className={cn(
              'rounded-full transition-all duration-300',
              i === index ? 'h-2 w-2 bg-white shadow-sm' : 'h-1.5 w-1.5 bg-white/50 hover:bg-white/70'
            )}
            aria-label={`Go to image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/** Thumbnail (imageUrl) first, then remaining uploaded images without duplicates. */
export function getProductImages(product: {
  imageUrl?: string | null;
  images?: Array<{ url: string }>;
}): string[] {
  const thumbnail = product.imageUrl?.trim() || null;
  const fromRelation = product.images?.map((img) => img.url).filter(Boolean) ?? [];

  if (thumbnail) {
    const rest = fromRelation.filter((url) => url !== thumbnail);
    return [thumbnail, ...rest];
  }

  if (fromRelation.length > 0) return fromRelation;
  return [];
}
