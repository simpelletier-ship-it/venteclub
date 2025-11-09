import { z } from 'zod';

export const businessSchema = z.object({
  title: z.string()
    .trim()
    .min(5, 'Le titre doit contenir au moins 5 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  description: z.string()
    .min(1, 'La description est requise')
    .max(10000, 'La description ne peut pas dépasser 10000 caractères'),
  industry: z.enum([
    'activite_sport_loisir',
    'art_spectacle_cinema',
    'hebergement',
    'bar_bistro_discotheque',
    'batiment_immeuble',
    'beaute_esthetique',
    'boutique_commerce_detail',
    'camping',
    'centre_equestre_erabliere',
    'transport_entreposage',
    'construction_excavation_renovation',
    'developpement_domaine',
    'distribution_commerce_gros',
    'domaine_alimentaire',
    'communications_informatique',
    'education_garderie',
    'entreprise_service',
    'entreprise_saisonniere',
    'epicerie_depanneur',
    'franchise',
    'garage_mecanique_concessionnaire',
    'immeuble_revenus',
    'industrie_manufacturier_transformation',
    'jardin_pepiniere_verger_vignoble',
    'pourvoirie_centre_plein_air',
    'residence_sante',
    'residentiel',
    'restaurant'
  ], { errorMap: () => ({ message: 'Veuillez sélectionner une industrie valide' }) }),
  location: z.string()
    .trim()
    .max(100, 'La localisation ne peut pas dépasser 100 caractères')
    .optional()
    .nullable(),
  asking_price: z.number()
    .min(0, 'Le prix doit être positif ou 0 pour "à discuter"')
    .max(999999999, 'Le prix ne peut pas dépasser 999 999 999'),
  annual_revenue: z.number()
    .positive('Le chiffre d\'affaires doit être positif')
    .max(999999999, 'Le chiffre d\'affaires ne peut pas dépasser 999 999 999')
    .optional()
    .nullable(),
  profit_margin: z.number()
    .positive('La marge bénéficiaire doit être positive')
    .max(999999999, 'La marge bénéficiaire ne peut pas dépasser 999 999 999')
    .optional()
    .nullable(),
  baiia: z.number()
    .positive('Le BAIIA doit être positif')
    .max(999999999, 'Le BAIIA ne peut pas dépasser 999 999 999')
    .optional()
    .nullable(),
  employees_count: z.number()
    .int('Le nombre d\'employés doit être un nombre entier')
    .positive('Le nombre d\'employés doit être positif')
    .max(1000000, 'Le nombre d\'employés ne peut pas dépasser 1 000 000')
    .optional()
    .nullable(),
  year_established: z.number()
    .int('L\'année d\'établissement doit être un nombre entier')
    .min(1800, 'L\'année d\'établissement ne peut pas être avant 1800')
    .max(new Date().getFullYear(), 'L\'année d\'établissement ne peut pas être dans le futur')
    .optional()
    .nullable(),
});

// Schéma pour la connexion - validation légère
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email('Veuillez entrer une adresse email valide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères'),
  password: z.string()
    .min(1, 'Le mot de passe est requis')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
});

// Schéma pour l'inscription - validation stricte de sécurité professionnelle
export const signupSchema = z.object({
  firstName: z.string()
    .trim()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
  lastName: z.string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  email: z.string()
    .trim()
    .email('Veuillez entrer une adresse email valide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une lettre minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)'),
});

// Pour la compatibilité - utiliser signupSchema par défaut
export const authSchema = signupSchema;

export type BusinessFormData = z.infer<typeof businessSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type AuthFormData = z.infer<typeof authSchema>;