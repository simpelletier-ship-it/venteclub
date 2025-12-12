import { Helmet } from "react-helmet";

interface WebAppSchemaProps {
  name: string;
  description: string;
  url: string;
  category?: string;
  keywords?: string[];
  screenshot?: string;
  rating?: {
    value: number;
    count: number;
  };
}

export function WebAppSchema({ 
  name, 
  description, 
  url, 
  category = "FinanceApplication",
  keywords = [],
  screenshot,
  rating
}: WebAppSchemaProps) {
  const schemaData: any = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": name,
    "description": description,
    "url": url,
    "applicationCategory": category,
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CAD"
    },
    "provider": {
      "@type": "Organization",
      "name": "Vente.Club",
      "url": "https://vente.club"
    },
    "inLanguage": "fr-CA",
    "isAccessibleForFree": true
  };

  if (keywords.length > 0) {
    schemaData.keywords = keywords.join(", ");
  }

  if (screenshot) {
    schemaData.screenshot = screenshot;
  }

  if (rating) {
    schemaData.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": rating.value,
      "ratingCount": rating.count,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}
