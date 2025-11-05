import { Helmet } from "react-helmet";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  type?: "website" | "article" | "product";
  structuredData?: object;
}

export const SEO = ({
  title = "Vente.club - Achat et Vente d'Entreprises au Québec | Plateforme #1",
  description = "Achetez ou vendez votre entreprise au Québec sur la plateforme #1. Des centaines d'opportunités : restaurants, commerces, franchises. Contactez directement les propriétaires. Transactions sécurisées et accompagnement professionnel.",
  keywords = "vente entreprise Québec, achat commerce Montréal, vendre restaurant, acheter franchise, opportunité affaires, cession entreprise, reprise commerce",
  ogImage = "/og-image.jpg",
  canonical,
  type = "website",
  structuredData,
}: SEOProps) => {
  // Temporairement désactivé pour debug
  return null;
};
