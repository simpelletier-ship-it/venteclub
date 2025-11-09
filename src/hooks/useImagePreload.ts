import { useEffect, useState } from 'react';

/**
 * Hook pour précharger les images critiques
 * Utile pour les images hero ou above-the-fold
 */
export const useImagePreload = (src: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
    };
    
    img.onerror = () => {
      setError(new Error(`Failed to load image: ${src}`));
    };
    
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { isLoaded, error };
};

/**
 * Hook pour précharger plusieurs images
 */
export const useImagesPreload = (sources: string[]) => {
  const [loadedCount, setLoadedCount] = useState(0);
  const [errors, setErrors] = useState<Error[]>([]);
  const isAllLoaded = loadedCount === sources.length;

  useEffect(() => {
    let mounted = true;
    let loadedSoFar = 0;
    const errorsList: Error[] = [];

    sources.forEach((src) => {
      const img = new Image();
      
      img.onload = () => {
        if (mounted) {
          loadedSoFar++;
          setLoadedCount(loadedSoFar);
        }
      };
      
      img.onerror = () => {
        if (mounted) {
          errorsList.push(new Error(`Failed to load image: ${src}`));
          setErrors([...errorsList]);
          loadedSoFar++;
          setLoadedCount(loadedSoFar);
        }
      };
      
      img.src = src;
    });

    return () => {
      mounted = false;
    };
  }, [sources]);

  return { loadedCount, isAllLoaded, errors };
};
