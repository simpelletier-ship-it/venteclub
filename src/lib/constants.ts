// Quebec business categories
export const QUEBEC_INDUSTRIES = [
  'Restaurant et services alimentaires',
  'Commerce de détail',
  'Services professionnels',
  'Technologie et logiciels',
  'Construction et rénovation',
  'Santé et bien-être',
  'Éducation et formation',
  'Tourisme et hôtellerie',
  'Transport et logistique',
  'Immobilier',
  'Agriculture et agroalimentaire',
  'Arts et divertissement',
  'Services aux entreprises',
  'Fabrication et production',
  'E-commerce',
] as const;

export type IndustryType = typeof QUEBEC_INDUSTRIES[number];

export const CURRENCY = {
  CAD: { symbol: '$', code: 'CAD', name: 'Dollar canadien' },
} as const;