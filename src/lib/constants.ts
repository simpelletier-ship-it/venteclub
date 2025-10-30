// Quebec business categories matching database enum
export const QUEBEC_INDUSTRIES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'boutique_commerce_detail', label: 'Commerce de détail' },
  { value: 'entreprise_service', label: 'Services' },
  { value: 'communications_informatique', label: 'Technologie' },
  { value: 'batiment_immeuble', label: 'Immobilier' },
  { value: 'residence_sante', label: 'Santé' },
  { value: 'education_garderie', label: 'Éducation' },
  { value: 'industrie_manufacturier_transformation', label: 'Manufacturing' },
  { value: 'transport_entreposage', label: 'Transport' },
  { value: 'bar_bistro_discotheque', label: 'Bar / Bistro' },
  { value: 'beaute_esthetique', label: 'Beauté / Esthétique' },
  { value: 'camping', label: 'Camping' },
  { value: 'hebergement', label: 'Hébergement' },
  { value: 'domaine_alimentaire', label: 'Domaine alimentaire' },
  { value: 'epicerie_depanneur', label: 'Épicerie / Dépanneur' },
  { value: 'garage_mecanique_concessionnaire', label: 'Garage / Mécanique' },
  { value: 'activite_sport_loisir', label: 'Sport / Loisir' },
  { value: 'art_spectacle_cinema', label: 'Art / Spectacle' },
  { value: 'entreprise_saisonniere', label: 'Entreprise saisonnière' },
] as const;

export type IndustryType = typeof QUEBEC_INDUSTRIES[number];

export const CURRENCY = {
  CAD: { symbol: '$', code: 'CAD', name: 'Dollar canadien' },
} as const;

export const LISTING_TYPES = [
  { value: 'business', label: 'Entreprise' },
  { value: 'franchise', label: 'Franchise' },
  { value: 'property', label: 'Immeuble' },
] as const;

export type ListingType = typeof LISTING_TYPES[number];