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
    <div className="relative w-full h-full">
      {isLoading && (
        <Skeleton className={`absolute inset-0 ${className}`} />
      )}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{ objectFit, ...(aspectRatio && { aspectRatio }) }}
        {...props}
      />
    </div>
  );
};
