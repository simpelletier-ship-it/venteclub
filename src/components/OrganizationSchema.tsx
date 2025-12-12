import { Helmet } from "react-helmet";

export const OrganizationSchema = () => {
  const siteUrl = window.location.origin;
  
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Budget.club",
    "alternateName": "Budget Club",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "Plateforme de gestion budgétaire et outils financiers québécois. Calculateurs de salaire, retour d'impôt et planificateur de budget personnel.",
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
