import { useEffect } from 'react';
import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

/**
 * Hook pour monitorer les Core Web Vitals
 */
export const useWebVitals = () => {
  useEffect(() => {
    const sendToAnalytics = (metric: Metric) => {
      // Log en développement
      if (import.meta.env.DEV) {
        console.log(`[Web Vital] ${metric.name}:`, {
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
        });
      }

      // En production, envoyer à Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_category: 'Web Vitals',
          event_label: metric.id,
          non_interaction: true,
        });
      }
    };

    // Mesure des Core Web Vitals
    onCLS(sendToAnalytics); // Cumulative Layout Shift
    onINP(sendToAnalytics); // Interaction to Next Paint (remplace FID)
    onFCP(sendToAnalytics); // First Contentful Paint
    onLCP(sendToAnalytics); // Largest Contentful Paint
    onTTFB(sendToAnalytics); // Time to First Byte
  }, []);
};

/**
 * Hook pour mesurer le temps de rendu d'un composant
 * Utile pour identifier les composants qui ralentissent l'application
 */
export const useRenderTime = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (import.meta.env.DEV) {
        console.log(`[Render Time] ${componentName}: ${renderTime.toFixed(2)}ms`);
      }

      // Alerte si le rendu est trop lent (>100ms)
      if (renderTime > 100) {
        console.warn(
          `⚠️ ${componentName} took ${renderTime.toFixed(2)}ms to render. Consider optimization.`
        );
      }
    };
  }, [componentName]);
};

/**
 * Hook pour mesurer les temps de chargement des images
 * Aide à identifier les images qui ralentissent le chargement de la page
 */
export const useImageLoadTime = (imageUrl: string, componentName?: string) => {
  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    const startTime = performance.now();

    img.onload = () => {
      const loadTime = performance.now() - startTime;
      
      if (import.meta.env.DEV) {
        const prefix = componentName ? `[${componentName}]` : '[Image Load]';
        console.log(`${prefix} ${imageUrl.substring(0, 50)}...: ${loadTime.toFixed(2)}ms`);
      }

      // Alerte si l'image est trop lente à charger (>1s)
      if (loadTime > 1000) {
        console.warn(
          `⚠️ Image took ${loadTime.toFixed(2)}ms to load. Consider optimization:`,
          imageUrl.substring(0, 100)
        );
      }
    };

    img.onerror = () => {
      if (import.meta.env.DEV) {
        console.error(`❌ Failed to load image:`, imageUrl.substring(0, 100));
      }
    };

    img.src = imageUrl;
  }, [imageUrl, componentName]);
};

/**
 * Hook pour mesurer le temps d'exécution d'une fonction
 */
export const useFunctionPerformance = (
  functionName: string,
  fn: () => void | Promise<void>,
  deps: any[] = []
) => {
  useEffect(() => {
    const measurePerformance = async () => {
      const startTime = performance.now();
      
      try {
        await fn();
      } finally {
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        if (import.meta.env.DEV) {
          console.log(`[Function Performance] ${functionName}: ${executionTime.toFixed(2)}ms`);
        }

        if (executionTime > 500) {
          console.warn(
            `⚠️ ${functionName} took ${executionTime.toFixed(2)}ms to execute. Consider optimization.`
          );
        }
      }
    };

    measurePerformance();
  }, deps);
};
