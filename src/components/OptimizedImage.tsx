import { useState, ImgHTMLAttributes } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Image as ImageIcon } from "lucide-react";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'loading'> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: boolean; // Pour les images above-the-fold
}

/**
 * Composant d'image optimisé avec:
 * - Lazy loading natif ou eager pour images prioritaires
 * - Support WebP avec fallback
 * - Skeleton pendant le chargement
 * - Gestion d'erreurs avec fallback personnalisable
 * - fetchpriority pour améliorer LCP
 */
export const OptimizedImage = ({
  src,
  alt,
  fallback,
  aspectRatio,
  objectFit = 'cover',
  priority = false,
  className = '',
  ...props
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Convertir l'URL vers WebP si possible
  const getOptimizedSrc = (url: string): { webp: string; fallback: string } => {
    // Si c'est une URL Supabase Storage
    if (url.includes('supabase.co/storage')) {
      // On retourne l'URL originale - Supabase gère l'optimisation
      return { webp: url, fallback: url };
    }
    
    // Pour les images locales ou autres
    const extension = url.split('.').pop()?.toLowerCase();
    if (extension && ['jpg', 'jpeg', 'png'].includes(extension)) {
      const webpUrl = url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      return { webp: webpUrl, fallback: url };
    }
    
    return { webp: url, fallback: url };
  };

  const { webp, fallback: fallbackSrc } = getOptimizedSrc(src);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
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

  return (
    <div className="relative" style={{ aspectRatio }}>
      {isLoading && (
        <Skeleton className={`absolute inset-0 ${className}`} />
      )}
      <picture>
        {/* Source WebP pour les navigateurs modernes */}
        <source srcSet={webp} type="image/webp" />
        {/* Fallback pour les navigateurs plus anciens */}
        <img
          src={fallbackSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          style={{ objectFit }}
          {...props}
        />
      </picture>
    </div>
  );
};
