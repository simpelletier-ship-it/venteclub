/**
 * Defer non-critical scripts and resources
 * Load them after the page is interactive
 */

export const deferNonCriticalResources = () => {
  // Use requestIdleCallback if available, otherwise setTimeout
  const scheduleDeferred = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 1);
    }
  };

  // Defer Web Vitals initialization
  scheduleDeferred(() => {
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      const sendToAnalytics = (metric: any) => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', metric.name, {
            event_category: 'Web Vitals',
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            event_label: metric.id,
            non_interaction: true,
          });
        }
      };

      onCLS(sendToAnalytics);
      onFCP(sendToAnalytics);
      onLCP(sendToAnalytics);
      onTTFB(sendToAnalytics);
      onINP(sendToAnalytics);
    });
  });
};
