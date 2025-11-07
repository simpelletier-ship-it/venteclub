/**
 * Format a price or price range for display
 * @param minPrice - Minimum price or single price
 * @param maxPrice - Maximum price (optional, for price ranges)
 * @returns Formatted price string
 */
export const formatPrice = (minPrice: number | null | undefined, maxPrice?: number | null): string => {
  if (minPrice === null || minPrice === undefined) {
    return 'N/A';
  }
  
  if (minPrice === 0) {
    return 'À discuter';
  }
  
  const formatNumber = (num: number) => num.toLocaleString('fr-CA');
  
  if (maxPrice && maxPrice > minPrice) {
    return `${formatNumber(minPrice)} $ - ${formatNumber(maxPrice)} $`;
  }
  
  return `${formatNumber(minPrice)} $`;
};
