import { useState, useEffect } from 'react';

// Cache simple en mémoire pour les images
const imageCache = new Map<string, string>();

export const useImageCache = (businessId: string | undefined, fetchImage: () => Promise<string | null>) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    // Vérifier le cache
    if (imageCache.has(businessId)) {
      setImageUrl(imageCache.get(businessId) || null);
      setLoading(false);
      return;
    }

    // Charger l'image avec un délai pour ne pas bloquer le rendu
    const timeoutId = setTimeout(async () => {
      try {
        const url = await fetchImage();
        if (url) {
          imageCache.set(businessId, url);
          setImageUrl(url);
        }
      } catch (error) {
        console.error('Error loading image:', error);
      } finally {
        setLoading(false);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [businessId]);

  return { imageUrl, loading };
};
