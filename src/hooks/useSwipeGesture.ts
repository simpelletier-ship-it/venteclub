import { useEffect, useRef, useState } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: (velocity: number) => void;
  onSwipeRight?: (velocity: number) => void;
  threshold?: number; // Distance minimale pour déclencher un swipe (px)
  velocityThreshold?: number; // Vélocité minimale pour un swipe rapide (px/ms)
}

interface TouchInfo {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
}

export const useSwipeGesture = (
  elementRef: React.RefObject<HTMLElement>,
  options: SwipeGestureOptions = {}
) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    velocityThreshold = 0.3
  } = options;

  const touchInfo = useRef<TouchInfo | null>(null);
  const [velocity, setVelocity] = useState(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchInfo.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        currentX: touch.clientX,
        currentY: touch.clientY,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchInfo.current) return;
      
      const touch = e.touches[0];
      touchInfo.current.currentX = touch.clientX;
      touchInfo.current.currentY = touch.clientY;
    };

    const handleTouchEnd = () => {
      if (!touchInfo.current) return;

      const {
        startX,
        startY,
        startTime,
        currentX,
        currentY,
      } = touchInfo.current;

      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      const deltaTime = Date.now() - startTime;

      // Calculer la vélocité (px/ms)
      const velocityX = Math.abs(deltaX) / deltaTime;
      const velocityY = Math.abs(deltaY) / deltaTime;

      // Ignorer si le mouvement est plus vertical qu'horizontal
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        touchInfo.current = null;
        return;
      }

      // Vérifier si le swipe est assez long
      if (Math.abs(deltaX) < threshold) {
        touchInfo.current = null;
        return;
      }

      // Mettre à jour la vélocité pour l'affichage
      setVelocity(velocityX);

      // Déclencher les callbacks appropriés
      if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft(velocityX);
      } else if (deltaX > 0 && onSwipeRight) {
        onSwipeRight(velocityX);
      }

      touchInfo.current = null;
    };

    const handleTouchCancel = () => {
      touchInfo.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [elementRef, onSwipeLeft, onSwipeRight, threshold, velocityThreshold]);

  return { velocity };
};
