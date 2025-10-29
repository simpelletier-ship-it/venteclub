import { z } from 'zod';

export const businessSchema = z.object({
  title: z.string()
    .trim()
    .min(5, 'Le titre doit contenir au moins 5 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  description: z.string()
    .trim()
    .min(20, 'La description doit contenir au moins 20 caractères')
    .max(5000, 'La description ne peut pas dépasser 5000 caractères'),
  industry: z.enum([
    'Restaurant',
    'Commerce de détail',
    'Services',
    'Technologie',
    'Immobilier',
    'Santé',
    'Éducation',
    'Manufacturing',
    'Transport',
    'Autre'
  ], { errorMap: () => ({ message: 'Veuillez sélectionner une industrie valide' }) }),
  location: z.string()
    .trim()
    .min(2, 'La localisation doit contenir au moins 2 caractères')
    .max(100, 'La localisation ne peut pas dépasser 100 caractères'),
  asking_price: z.number()
    .positive('Le prix doit être positif')
    .max(999999999, 'Le prix ne peut pas dépasser 999 999 999'),
  annual_revenue: z.number()
    .positive('Le chiffre d\'affaires doit être positif')
    .max(999999999, 'Le chiffre d\'affaires ne peut pas dépasser 999 999 999')
    .optional()
    .nullable(),
  profit_margin: z.number()
    .min(0, 'La marge bénéficiaire ne peut pas être négative')
    .max(100, 'La marge bénéficiaire ne peut pas dépasser 100%')
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

export const authSchema = z.object({
  email: z.string()
    .trim()
    .email('Veuillez entrer une adresse email valide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
});

export type BusinessFormData = z.infer<typeof businessSchema>;
export type AuthFormData = z.infer<typeof authSchema>;