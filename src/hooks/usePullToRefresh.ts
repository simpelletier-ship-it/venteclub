import { useEffect, useRef, useState } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number; // Distance de tirage pour déclencher le refresh (px)
  maxPullDistance?: number; // Distance maximale de tirage (px)
  enabled?: boolean;
}

export const usePullToRefresh = (options: PullToRefreshOptions) => {
  const {
    onRefresh,
    threshold = 80,
    maxPullDistance = 150,
    enabled = true
  } = options;

  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const touchStartY = useRef(0);
  const scrollTop = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Vérifier si on est en haut de la page
      scrollTop.current = window.scrollY || document.documentElement.scrollTop;
      
      if (scrollTop.current === 0) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const currentScrollTop = window.scrollY || document.documentElement.scrollTop;
      
      // Ne déclencher que si on est en haut de la page et qu'on tire vers le bas
      if (currentScrollTop === 0 && touchStartY.current > 0) {
        const pullDist = currentY - touchStartY.current;
        
        if (pullDist > 0) {
          // Empêcher le scroll par défaut pendant le pull
          e.preventDefault();
          
          // Appliquer une résistance progressive (effet élastique)
          const resistance = 0.5;
          const adjustedPullDist = Math.min(
            pullDist * resistance,
            maxPullDistance
          );
          
          setPullDistance(adjustedPullDist);
          setIsPulling(adjustedPullDist > 10);
        }
      }
    };

    const handleTouchEnd = async () => {
      if (isRefreshing) return;
      
      if (pullDistance >= threshold) {
        // Déclencher le refresh
        setIsRefreshing(true);
        setPullDistance(threshold);
        
        try {
          // Vibration haptique pour confirmer le refresh
          if ('vibrate' in navigator) {
            navigator.vibrate(20);
          }
          
          await onRefresh();
        } catch (error) {
          console.error('Erreur lors du refresh:', error);
        } finally {
          // Attendre un peu avant de réinitialiser pour l'animation
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
            setIsPulling(false);
          }, 500);
        }
      } else {
        // Réinitialiser sans refresh
        setPullDistance(0);
        setIsPulling(false);
      }
      
      touchStartY.current = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onRefresh, threshold, maxPullDistance, pullDistance, isRefreshing]);

  // Calculer le pourcentage de progression (0-100)
  const progress = Math.min((pullDistance / threshold) * 100, 100);
  
  // Déterminer si on a atteint le seuil de déclenchement
  const canRefresh = pullDistance >= threshold;

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    progress,
    canRefresh
  };
};
