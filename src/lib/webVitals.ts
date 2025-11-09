/**
 * Web Vitals Monitoring
 * Mesure et envoie les Core Web Vitals à Google Analytics
 */

import { onCLS, onLCP, onFCP, onTTFB, onINP, type Metric } from 'web-vitals';

const sendToAnalytics = (metric: Metric) => {
  // Envoi à Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Log en développement
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }
};

export const initWebVitals = () => {
  // Core Web Vitals
  onCLS(sendToAnalytics);  // Cumulative Layout Shift
  onLCP(sendToAnalytics);  // Largest Contentful Paint
  onINP(sendToAnalytics);  // Interaction to Next Paint (nouvelle métrique)
  
  // Métriques supplémentaires
  onFCP(sendToAnalytics);  // First Contentful Paint
  onTTFB(sendToAnalytics); // Time to First Byte
};
