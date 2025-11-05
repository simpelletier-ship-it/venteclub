import { Helmet } from "react-helmet";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  type?: "website" | "article" | "product";
  structuredData?: object;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
  noindex?: boolean;
}

export const SEO = ({
  title = "Vente.club - Achat et Vente d'Entreprises au Québec | Plateforme #1",
  description = "Achetez ou vendez votre entreprise au Québec sur la plateforme #1. Des centaines d'opportunités : restaurants, commerces, franchises. Contactez directement les propriétaires. Transactions sécurisées et accompagnement professionnel.",
  keywords = "vente entreprise Québec, achat commerce Montréal, vendre restaurant, acheter franchise, opportunité affaires, cession entreprise, reprise commerce",
  ogImage = "/og-image.jpg",
  canonical,
  type = "website",
  structuredData,
  articlePublishedTime,
  articleModifiedTime,
  articleAuthor,
  noindex = false,
}: SEOProps) => {
  const siteUrl = window.location.origin;
  const currentUrl = canonical ? `${siteUrl}${canonical}` : window.location.href;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Vente.club" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:locale" content="fr_CA" />
      
      {/* Article Meta Tags */}
      {type === "article" && articlePublishedTime && (
        <meta property="article:published_time" content={articlePublishedTime} />
      )}
      {type === "article" && articleModifiedTime && (
        <meta property="article:modified_time" content={articleModifiedTime} />
      )}
      {type === "article" && articleAuthor && (
        <meta property="article:author" content={articleAuthor} />
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      
      {/* Additional SEO Tags */}
      <meta name="language" content="French" />
      <meta name="geo.region" content="CA-QC" />
      <meta name="geo.placename" content="Québec" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};
