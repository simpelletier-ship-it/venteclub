import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BusinessCard from "@/components/BusinessCard";
import { MapPin, TrendingUp, Building2, Users } from "lucide-react";

interface CityInfo {
  name: string;
  slug: string;
  description: string;
  population: string;
  economicStrength: string;
}

const cityData: Record<string, CityInfo> = {
  montreal: {
    name: "Montréal",
    slug: "montreal",
    description: "Montréal, métropole économique du Québec, offre un écosystème d'affaires dynamique et diversifié. Capitale culturelle et centre financier, la ville regorge d'opportunités d'affaires dans tous les secteurs.",
    population: "1,8 million",
    economicStrength: "Commerce de détail, restauration, technologie, services professionnels"
  },
  quebec: {
    name: "Québec",
    slug: "quebec",
    description: "Québec, capitale nationale, combine charme historique et économie moderne. La ville offre un marché stable pour les entreprises, particulièrement dans le tourisme, les technologies et les services.",
    population: "550 000",
    economicStrength: "Tourisme, administration publique, technologies, services"
  },
  laval: {
    name: "Laval",
    slug: "laval",
    description: "Laval, troisième ville en importance au Québec, bénéficie de sa proximité avec Montréal tout en offrant un environnement d'affaires distinct. Marché en croissance constante avec une économie diversifiée.",
    population: "450 000",
    economicStrength: "Commerce de détail, services, manufacturing, biotechnologie"
  },
  gatineau: {
    name: "Gatineau",
    slug: "gatineau",
    description: "Gatineau, située dans la région de la capitale nationale, profite de sa position stratégique aux portes d'Ottawa. Économie robuste soutenue par le secteur public et un tissu entrepreneurial actif.",
    population: "290 000",
    economicStrength: "Services gouvernementaux, technologie, tourisme, commerce"
  },
  sherbrooke: {
    name: "Sherbrooke",
    slug: "sherbrooke",
    description: "Sherbrooke, capitale des Cantons-de-l'Est, se distingue par son économie innovante et sa qualité de vie. Hub universitaire et technologique avec des opportunités dans divers secteurs.",
    population: "170 000",
    economicStrength: "Éducation, santé, technologies, manufacturing avancé"
  }
};

const CityPage = () => {
  const { city: cityParam } = useParams<{ city: string }>();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Extract city name from URL parameter
  const citySlug = cityParam || '';
  const cityInfo = cityData[citySlug];

  useEffect(() => {
    if (cityInfo) {
      fetchBusinesses();
    }
  }, [cityInfo]);

  const fetchBusinesses = async () => {
    if (!cityInfo) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('status', 'active')
        .eq('approval_status', 'approved')
        .ilike('city', `%${cityInfo.name}%`)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!cityInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Ville non trouvée</h1>
          <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Entreprises à vendre à ${cityInfo.name}`,
    "description": `Découvrez les opportunités d'affaires à ${cityInfo.name}, Québec. ${cityInfo.description}`,
    "url": `https://vente.club/entreprises-a-vendre-${cityInfo.slug}`,
    "about": {
      "@type": "Place",
      "name": cityInfo.name,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": cityInfo.name,
        "addressRegion": "QC",
        "addressCountry": "CA"
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`Entreprises à Vendre ${cityInfo.name} | Achat Commerce PME ${cityInfo.name} QC`}
        description={`Découvrez ${businesses.length}+ entreprises à vendre à ${cityInfo.name}, Québec. Restaurants, commerces, franchises. Transactions sécurisées. ${cityInfo.description}`}
        keywords={`entreprise à vendre ${cityInfo.name}, achat commerce ${cityInfo.name}, vendre entreprise ${cityInfo.name}, PME ${cityInfo.name}, opportunité affaires ${cityInfo.name}`}
        canonical={`/entreprises-a-vendre-${cityInfo.slug}`}
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-8 h-8 text-accent" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Entreprises à Vendre à {cityInfo.name}
              </h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8">
              {cityInfo.description}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
                <Users className="w-8 h-8 text-accent mb-3" />
                <h3 className="font-bold mb-1">Population</h3>
                <p className="text-2xl font-bold text-accent">{cityInfo.population}</p>
              </div>
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
                <Building2 className="w-8 h-8 text-accent mb-3" />
                <h3 className="font-bold mb-1">Entreprises Disponibles</h3>
                <p className="text-2xl font-bold text-accent">{businesses.length}+</p>
              </div>
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
                <TrendingUp className="w-8 h-8 text-accent mb-3" />
                <h3 className="font-bold mb-1">Secteurs Clés</h3>
                <p className="text-sm text-muted-foreground mt-2">{cityInfo.economicStrength}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intro Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">
              Pourquoi Investir à {cityInfo.name} ?
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-4">
                {cityInfo.name} représente un marché dynamique pour l'acquisition d'entreprises au Québec. 
                Avec une économie diversifiée et un environnement d'affaires favorable, la ville offre des 
                opportunités exceptionnelles pour les entrepreneurs et investisseurs.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Que vous cherchiez un restaurant établi, un commerce de détail prospère, ou une PME en croissance, 
                {cityInfo.name} dispose d'un écosystème entrepreneurial mature qui facilite les transitions d'entreprises réussies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Businesses Listing */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">
            Entreprises Disponibles à {cityInfo.name}
          </h2>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement des entreprises...</p>
            </div>
          ) : businesses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((business) => (
                <BusinessCard key={business.id} {...business} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <p className="text-muted-foreground mb-4">
                Aucune entreprise disponible actuellement à {cityInfo.name}
              </p>
              <Button onClick={() => navigate("/")}>
                Voir toutes les opportunités
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-accent/10 to-primary/10 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Vous Vendez Votre Entreprise à {cityInfo.name} ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez des centaines d'entrepreneurs qui font confiance à Vente.Club 
              pour vendre leur entreprise rapidement et en toute sécurité.
            </p>
            <Button size="lg" onClick={() => navigate("/list-business")} className="bg-accent hover:bg-accent/90">
              Publier Mon Annonce Gratuitement
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CityPage;