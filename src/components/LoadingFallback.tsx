/**
 * Optimized loading fallback component
 * Uses inline classes matching critical CSS for instant render
 */

export const LoadingFallback = () => (
  <div className="loading-spinner">
    <div className="spinner" />
  </div>
);
