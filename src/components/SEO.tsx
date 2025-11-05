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
  
  // Core Organization - Centre de la toile
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    "name": "Vente.club",
    "alternateName": "Vente Club",
    "description": "Marketplace québécoise spécialisée dans l'achat et la vente d'entreprises au Québec",
    "url": siteUrl,
    "logo": {
      "@type": "ImageObject",
      "@id": `${siteUrl}/#logo`,
      "url": `${siteUrl}/logo.png`,
      "contentUrl": `${siteUrl}/logo.png`,
      "caption": "Vente.club"
    },
    "image": {
      "@type": "ImageObject",
      "@id": `${siteUrl}/#primaryImage`,
      "url": `${siteUrl}/og-image.jpg`,
      "contentUrl": `${siteUrl}/og-image.jpg`
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CA",
      "addressRegion": "QC"
    },
    "areaServed": {
      "@type": "Place",
      "name": "Québec",
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "46.8139",
        "longitude": "-71.2080"
      }
    },
    "knowsAbout": [
      "vente entreprise Québec",
      "achat commerce",
      "acheter une entreprise",
      "entreprises à vendre",
      "cession entreprise",
      "reprise commerce"
    ],
    "sameAs": []
  };

  // WebSite avec potentiel de recherche
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    "url": siteUrl,
    "name": "Vente.club",
    "description": "Plateforme d'achat et vente d'entreprises au Québec",
    "publisher": {
      "@id": `${siteUrl}/#organization`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/entreprises?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": "fr-CA"
  };

  // WebPage structure avec BreadcrumbList
  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": currentUrl,
    "url": currentUrl,
    "name": title,
    "description": description,
    "isPartOf": {
      "@id": `${siteUrl}/#website`
    },
    "about": {
      "@id": `${siteUrl}/#organization`
    },
    "primaryImageOfPage": {
      "@id": `${siteUrl}/#primaryImage`
    },
    "inLanguage": "fr-CA",
    "publisher": {
      "@id": `${siteUrl}/#organization`
    }
  };

  // Navigation structure - Les nœuds de la toile
  const siteNavigationData = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    "@id": `${siteUrl}/#navigation`,
    "name": "Navigation principale",
    "hasPart": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/#homepage`,
        "name": "Accueil",
        "url": siteUrl,
        "description": "Page d'accueil - Entreprises à vendre au Québec",
        "isPartOf": { "@id": `${siteUrl}/#website` },
        "about": { "@id": `${siteUrl}/#organization` }
      },
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}/entreprises#page`,
        "name": "Entreprises à Vendre",
        "url": `${siteUrl}/entreprises`,
        "description": "Catalogue complet des entreprises à vendre au Québec",
        "isPartOf": { "@id": `${siteUrl}/#website` },
        "about": { "@id": `${siteUrl}/#organization` },
        "mainEntity": {
          "@type": "ItemList",
          "name": "Liste des entreprises disponibles"
        }
      },
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}/immeubles#page`,
        "name": "Immeubles Commerciaux",
        "url": `${siteUrl}/immeubles`,
        "description": "Immeubles commerciaux à vendre au Québec",
        "isPartOf": { "@id": `${siteUrl}/#website` },
        "about": { "@id": `${siteUrl}/#organization` }
      },
      {
        "@type": "Blog",
        "@id": `${siteUrl}/blog#blog`,
        "name": "Blog",
        "url": `${siteUrl}/blog`,
        "description": "Conseils pour acheter et vendre une entreprise au Québec",
        "isPartOf": { "@id": `${siteUrl}/#website` },
        "publisher": { "@id": `${siteUrl}/#organization` },
        "inLanguage": "fr-CA"
      },
      {
        "@type": "AboutPage",
        "@id": `${siteUrl}/a-propos#page`,
        "name": "À Propos",
        "url": `${siteUrl}/a-propos`,
        "description": "À propos de Vente.club",
        "isPartOf": { "@id": `${siteUrl}/#website` },
        "mainEntityOfPage": { "@id": `${siteUrl}/#organization` }
      },
      {
        "@type": "ContactPage",
        "@id": `${siteUrl}/contact#page`,
        "name": "Contact",
        "url": `${siteUrl}/contact`,
        "description": "Contactez Vente.club",
        "isPartOf": { "@id": `${siteUrl}/#website` },
        "about": { "@id": `${siteUrl}/#organization` }
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/vendre#page`,
        "name": "Vendre",
        "url": `${siteUrl}/vendre`,
        "description": "Vendez votre entreprise sur Vente.club",
        "isPartOf": { "@id": `${siteUrl}/#website` },
        "provider": { "@id": `${siteUrl}/#organization` }
      }
    ]
  };

  // BreadcrumbList pour la navigation
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${currentUrl}#breadcrumb`,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": {
          "@id": `${siteUrl}/#homepage`,
          "url": siteUrl
        }
      }
    ]
  };

  // FAQPage structure (si applicable)
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteUrl}/#faq`,
    "name": "Questions fréquentes sur l'achat et la vente d'entreprises",
    "isPartOf": { "@id": `${siteUrl}/#website` },
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Comment acheter une entreprise au Québec ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pour acheter une entreprise au Québec sur Vente.club, parcourez les annonces d'entreprises à vendre, contactez directement les propriétaires et effectuez votre due diligence. Notre plateforme facilite la mise en relation entre acheteurs et vendeurs."
        }
      },
      {
        "@type": "Question",
        "name": "Quels types d'entreprises sont disponibles ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Vente.club propose des restaurants, commerces de détail, franchises, entreprises de services, immeubles commerciaux et bien d'autres opportunités d'affaires à travers le Québec."
        }
      },
      {
        "@type": "Question",
        "name": "Comment vendre mon entreprise sur Vente.club ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Créez une annonce détaillée sur Vente.club avec les informations financières et opérationnelles de votre entreprise. Notre plateforme vous met en contact direct avec des acheteurs qualifiés au Québec."
        }
      }
    ]
  };

  // Combiner tous les schémas interconnectés
  const completeStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      organizationData,
      websiteData,
      webPageData,
      siteNavigationData,
      breadcrumbData,
      faqData
    ]
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

      {/* Complete Interconnected Schema - Toile d'araignée SEO */}
      <script type="application/ld+json">
        {JSON.stringify(completeStructuredData)}
      </script>

      {/* Additional Page-Specific Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};
