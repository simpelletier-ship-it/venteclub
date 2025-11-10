import { useEffect, useRef, useState } from 'react';

interface UseVisibleBusinessesOptions {
  rootMargin?: string; // Marge pour commencer le préchargement avant que l'élément soit visible
  threshold?: number;
}

/**
 * Hook pour détecter les annonces visibles à l'écran et précharger leurs images
 * Utilise Intersection Observer avec rootMargin pour précharger avant visibilité
 */
export const useVisibleBusinesses = (
  businessIds: string[],
  options: UseVisibleBusinessesOptions = {}
) => {
  const { rootMargin = '200px', threshold = 0.01 } = options;
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<string, Element>>(new Map());

  useEffect(() => {
    // Créer l'observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-business-id');
          if (!id) return;

          if (entry.isIntersecting) {
            setVisibleIds((prev) => new Set(prev).add(id));
          }
        });
      },
      {
        rootMargin, // Précharger 200px avant que l'élément entre dans le viewport
        threshold,
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [rootMargin, threshold]);

  // Fonction pour enregistrer un élément à observer
  const registerElement = (id: string, element: Element | null) => {
    if (!element || !observerRef.current) return;

    // Désinscrire l'ancien élément si existe
    const oldElement = elementsRef.current.get(id);
    if (oldElement) {
      observerRef.current.unobserve(oldElement);
    }

    // Enregistrer le nouveau
    elementsRef.current.set(id, element);
    observerRef.current.observe(element);
  };

  return {
    visibleIds,
    registerElement,
  };
};

/**
 * Fonction pour précharger une image
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Vérifier si l'image est déjà en cache
    const img = new Image();
    
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    
    img.src = src;
  });
};

/**
 * Hook pour précharger les images des annonces visibles
 */
export const usePreloadBusinessImages = (
  businessId: string,
  imageUrl: string | null,
  isVisible: boolean
) => {
  const [isPreloaded, setIsPreloaded] = useState(false);
  const hasPreloadedRef = useRef(false);

  useEffect(() => {
    if (!isVisible || !imageUrl || hasPreloadedRef.current) return;

    // Précharger l'image
    preloadImage(imageUrl)
      .then(() => {
        setIsPreloaded(true);
        hasPreloadedRef.current = true;
        
        if (import.meta.env.DEV) {
          console.log(`[Image Preloaded] Business ${businessId}`);
        }
      })
      .catch((error) => {
        console.warn(`[Preload Failed] Business ${businessId}:`, error);
      });
  }, [isVisible, imageUrl, businessId]);

  return isPreloaded;
};
