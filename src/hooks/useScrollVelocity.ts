import { useEffect, useState, useRef } from 'react';

interface ScrollVelocity {
  velocity: number; // pixels par seconde
  direction: 'up' | 'down' | 'idle';
  isScrolling: boolean;
}

/**
 * Hook pour calculer la vélocité du scroll
 * Utilisé pour prioriser le chargement des images
 */
export const useScrollVelocity = (): ScrollVelocity => {
  const [velocity, setVelocity] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down' | 'idle'>('idle');
  const [isScrolling, setIsScrolling] = useState(false);
  
  const lastScrollY = useRef(0);
  const lastTimestamp = useRef(Date.now());
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const currentTimestamp = Date.now();
      
      const deltaY = currentScrollY - lastScrollY.current;
      const deltaTime = currentTimestamp - lastTimestamp.current;
      
      // Calculer la vélocité en pixels par seconde
      const currentVelocity = Math.abs(deltaY / deltaTime) * 1000;
      
      setVelocity(currentVelocity);
      setDirection(deltaY > 0 ? 'down' : deltaY < 0 ? 'up' : 'idle');
      setIsScrolling(true);
      
      lastScrollY.current = currentScrollY;
      lastTimestamp.current = currentTimestamp;
      
      // Réinitialiser isScrolling après 150ms d'inactivité
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
        setVelocity(0);
        setDirection('idle');
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return { velocity, direction, isScrolling };
};
