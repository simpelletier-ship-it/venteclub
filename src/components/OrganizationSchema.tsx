import { Helmet } from "react-helmet";

export const OrganizationSchema = () => {
  const siteUrl = window.location.origin;
  
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Vente.club",
    "alternateName": "Vente Club",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "Plateforme spécialisée dans l'achat et la vente d'entreprises au Québec. Connectez acheteurs et vendeurs d'entreprises, commerces et franchises.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CA",
      "addressRegion": "QC"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "areaServed": "CA-QC",
      "availableLanguage": ["French"]
    },
    "sameAs": [
      "https://www.facebook.com/vente.club",
      "https://www.linkedin.com/company/vente-club"
    ],
    "foundingDate": "2024",
    "areaServed": {
      "@type": "State",
      "name": "Québec"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
    </Helmet>
  );
};
