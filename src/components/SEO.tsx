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
  const siteUrl = window.location.origin;
  const currentUrl = canonical ? `${siteUrl}${canonical}` : window.location.href;
  
  // Default Organization structured data
  const defaultOrganizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Vente.club",
    "description": "Plateforme québécoise pour l'achat et la vente d'entreprises au Québec",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "image": `${siteUrl}/og-image.jpg`,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CA",
      "addressRegion": "QC"
    },
    "areaServed": {
      "@type": "Place",
      "name": "Québec"
    },
    "sameAs": []
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={currentUrl} />
      
      {/* Favicon and Logo */}
      <link rel="icon" type="image/png" href="/favicon-vente.png" />
      <link rel="apple-touch-icon" href="/favicon-vente.png" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Vente.club - Achat et vente d'entreprises au Québec" />
      <meta property="og:site_name" content="Vente.club" />
      <meta property="og:locale" content="fr_CA" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      <meta name="twitter:image:alt" content="Vente.club - Achat et vente d'entreprises au Québec" />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="language" content="French" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Vente.club" />
      <meta httpEquiv="content-language" content="fr-CA" />

      {/* Geo Tags */}
      <meta name="geo.region" content="CA-QC" />
      <meta name="geo.placename" content="Québec" />

      {/* Organization Structured Data - Always include */}
      <script type="application/ld+json">
        {JSON.stringify(defaultOrganizationData)}
      </script>

      {/* Additional Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};
