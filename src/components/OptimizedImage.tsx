import { useState, ImgHTMLAttributes, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Image as ImageIcon } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useScrollVelocity } from "@/hooks/useScrollVelocity";
import { getImageLoadQueue } from "@/lib/imageLoadPriority";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'loading'> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: boolean; // Pour les images above-the-fold
  width?: number; // Largeur cible pour l'optimisation Supabase
  quality?: number; // Qualité de l'image (1-100)
  lazy?: boolean; // Active le lazy loading progressif (true par défaut)
  smartPriority?: boolean; // Active la priorisation dynamique (true par défaut)
}

/**
 * Optimise une URL d'image Supabase avec transformations
 * - Resize automatique selon la largeur
 * - Conversion WebP pour réduire la taille
 * - Compression avec qualité ajustable
 */
const getOptimizedImageUrl = (url: string, width?: number, quality: number = 80): string => {
  if (!url) return url;
  
  // Vérifier si c'est une image Supabase
  const isSupabaseImage = url.includes('supabase.co') && url.includes('/storage/v1/object/public/');
  
  if (!isSupabaseImage) return url;
  
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams();
    
    // Ajouter les transformations d'image Supabase
    if (width) {
      params.append('width', width.toString());
    }
    
    // Qualité (1-100)
    params.append('quality', quality.toString());
    
    // Format WebP pour réduire la taille de 25-35%
    params.append('format', 'webp');
    
    // Ajouter les paramètres à l'URL
    const transformedUrl = `${urlObj.origin}${urlObj.pathname}?${params.toString()}`;
    return transformedUrl;
  } catch (error) {
    console.warn('Failed to optimize image URL:', error);
    return url;
  }
};

/**
 * Composant d'image optimisé avec:
 * - Lazy loading progressif avec Intersection Observer
 * - Priorisation dynamique basée sur la vélocité et direction du scroll
 * - Chargement anticipé intelligent (jusqu'à 600px selon la vitesse)
 * - Transformations Supabase (resize, WebP, compression)
 * - Skeleton pendant le chargement
 * - Gestion d'erreurs avec fallback personnalisable
 * - fetchpriority pour améliorer LCP
 * - Responsive images avec srcset
 * - Blur placeholder pour une transition douce
 */
export const OptimizedImage = ({
  src,
  alt,
  fallback,
  aspectRatio,
  objectFit = 'cover',
  priority = false,
  width,
  quality = 80,
  lazy = true,
  smartPriority = true,
  className = '',
  ...props
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState(src);
  const [shouldLoad, setShouldLoad] = useState(!lazy || priority);
  const imageId = useRef(`img-${Math.random().toString(36).substr(2, 9)}`);

  // Observer la position et la vélocité du scroll
  const [containerRef, isVisible] = useIntersectionObserver({
    rootMargin: smartPriority ? '200px' : '50px', // Plus de marge si smart priority
    threshold: 0.01,
    freezeOnceVisible: true,
  });
  
  const { velocity, direction, isScrolling } = useScrollVelocity();

  // Optimiser l'URL de l'image au montage
  useEffect(() => {
    const optimized = getOptimizedImageUrl(src, width, quality);
    setOptimizedSrc(optimized);
  }, [src, width, quality]);

  // Gérer la priorisation dynamique avec la queue
  useEffect(() => {
    if (!lazy || priority || shouldLoad) return;
    if (!smartPriority) {
      // Mode simple: charger dès que visible
      if (isVisible) {
        setShouldLoad(true);
      }
      return;
    }

    // Mode smart: utiliser la queue de priorité
    if (isVisible && containerRef.current) {
      const queue = getImageLoadQueue();
      
      const loadCallback = () => {
        setShouldLoad(true);
      };

      queue.enqueue(
        imageId.current,
        containerRef.current,
        loadCallback,
        velocity,
        direction
      );

      // Mettre à jour les priorités pendant le scroll
      if (isScrolling) {
        queue.updatePriorities(velocity, direction);
      }
    }
  }, [isVisible, lazy, priority, shouldLoad, smartPriority, velocity, direction, isScrolling, containerRef]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Générer srcset pour responsive images
  const generateSrcSet = (): string => {
    if (!width || !src.includes('supabase.co')) return '';
    
    const sizes = [
      Math.round(width * 0.5),  // 0.5x
      width,                     // 1x
      Math.round(width * 1.5),   // 1.5x
      Math.round(width * 2),     // 2x
    ];
    
    return sizes
      .map(size => `${getOptimizedImageUrl(src, size, quality)} ${size}w`)
      .join(', ');
  };

  if (hasError) {
    return fallback || (
      <div 
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50 ${className}`}
        style={{ aspectRatio }}
      >
        <ImageIcon className="w-12 h-12 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Image non disponible</p>
      </div>
    );
  }

  const srcSet = generateSrcSet();

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {isLoading && (
        <Skeleton className={`absolute inset-0 ${className}`} />
      )}
      {shouldLoad && (
        <img
          src={optimizedSrc}
          srcSet={srcSet || undefined}
          sizes={width ? `(max-width: 768px) 100vw, ${width}px` : undefined}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} ${isLoading ? 'opacity-0 blur-sm' : 'opacity-100 blur-0'} transition-all duration-500 ease-out`}
          style={{ objectFit, ...(aspectRatio && { aspectRatio }) }}
          {...props}
        />
      )}
    </div>
  );
};
