/**
 * Formate un prix avec séparateurs de milliers et symbole $
 * @param price - Le prix à formater
 * @returns Le prix formaté (ex: "10 000 000 $")
 */
export const formatPrice = (price: number): string => {
  return `${price.toLocaleString('fr-CA', { 
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).replace(/,/g, ' ')} $`;
};

/**
 * Formate un prix de manière compacte (K pour milliers, M pour millions)
 * @param price - Le prix à formater
 * @returns Le prix formaté de manière compacte (ex: "1,5M $")
 */
export const formatPriceCompact = (price: number): string => {
  if (price >= 1000000) {
    const millions = price / 1000000;
    return `${millions.toLocaleString('fr-CA', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 1 
    })}M $`;
  } else if (price >= 1000) {
    const thousands = price / 1000;
    return `${thousands.toLocaleString('fr-CA', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    })}K $`;
  }
  return `${price} $`;
};
