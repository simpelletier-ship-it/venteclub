import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareButton } from "@/components/ShareButton";
import { ReportBusinessDialog } from "@/components/ReportBusinessDialog";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface BusinessHeroProps {
  business: any;
  businessId: string | null;
  userId: string | undefined;
  isSeller: boolean;
  mainPhoto?: string;
}

export const BusinessHero = ({ business, businessId, userId, isSeller, mainPhoto }: BusinessHeroProps) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={ref} className="relative w-full overflow-hidden">
      {/* Hero Background avec dégradé premium et effet parallaxe */}
      <motion.div style={{ y }} className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {mainPhoto && (
          <motion.div 
            style={{ opacity }}
            className="absolute inset-0 opacity-[0.12]"
          >
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${mainPhoto})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(60px) brightness(0.4)',
              }}
            />
          </motion.div>
        )}
        {/* Overlay gradient premium */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/98 to-slate-950/80" />
        
        {/* Effet de grain subtil pour texture */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />
      </motion.div>

      {/* Contenu */}
      <motion.div style={{ opacity }} className="relative">
        {/* Barre supérieure minimaliste */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between gap-4 px-6 lg:px-16 pt-8 pb-2"
        >
          <div className="flex items-center gap-3 flex-shrink min-w-0">
            {business.created_at && (
              <div className="flex items-center gap-2.5 text-[13px] text-white/40 font-light tracking-wide">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline truncate">{new Date(business.created_at).toLocaleDateString('fr-CA', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-8 flex-shrink-0">
            {businessId && (
              <>
                <div className="bg-white/8 hover:bg-white/15 backdrop-blur-xl rounded-full p-2 transition-all duration-300 border border-white/10">
                  <FavoriteButton businessId={businessId} userId={userId} />
                </div>
                <div className="bg-white/8 hover:bg-white/15 backdrop-blur-xl rounded-full transition-all duration-300 border border-white/10">
                  <ShareButton 
                    title={business.title} 
                    slug={business.slug} 
                    description={business.description}
                    variant="ghost"
                    size="icon"
                    className="text-white/70 hover:text-white hover:bg-transparent"
                  />
                </div>
              </>
            )}
            {!isSeller && businessId && (
              <div className="bg-white/8 hover:bg-white/15 backdrop-blur-xl rounded-full transition-all duration-300 border border-white/10">
                <ReportBusinessDialog businessId={businessId} businessTitle={business.title} />
              </div>
            )}
          </div>
        </motion.div>

        {/* Contenu principal */}
        <div className="px-6 lg:px-16 py-4 lg:py-6 pb-8 lg:pb-12">
          <div className="max-w-6xl">
            {/* Badges minimalistes */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap gap-2.5 mb-5"
            >
              {business.property_type ? (
                <Badge className="bg-white/8 text-white/90 border-white/15 backdrop-blur-2xl hover:bg-white/12 px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300 shadow-lg shadow-black/20">
                  Immobilier
                </Badge>
              ) : business.is_franchise ? (
                <Badge className="bg-purple-500/15 text-purple-100 border-purple-400/25 backdrop-blur-2xl hover:bg-purple-500/25 px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300 shadow-lg shadow-purple-900/30">
                  Franchise
                </Badge>
              ) : (
                <Badge className="bg-white/8 text-white/90 border-white/15 backdrop-blur-2xl hover:bg-white/12 px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300 shadow-lg shadow-black/20">
                  Entreprise
                </Badge>
              )}
              
              <div className="flex items-center gap-2 text-white/75 px-4 py-1.5 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 text-xs font-light shadow-lg shadow-black/20">
                <MapPin className="w-3.5 h-3.5" />
                {business.city || business.location}
              </div>
            </motion.div>

            {/* Titre optimisé */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight tracking-tight"
            >
              {business.title}
            </motion.h1>

            {/* Prix compact et élégant */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex flex-col sm:flex-row sm:items-end sm:gap-6"
            >
              <div className="flex flex-col">
                <div className="text-[10px] text-white/35 font-light uppercase tracking-widest mb-2">
                  Prix demandé
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-none">
                  {business.asking_price === 0 ? (
                    <span className="text-2xl sm:text-3xl lg:text-4xl">À discuter</span>
                  ) : (
                    <>
                      {business.asking_price.toLocaleString()}
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-light text-white/60 ml-1.5">$</span>
                    </>
                  )}
                </div>
              </div>
              
              {business.sale_type && (
                <div className="mt-4 sm:mt-0 sm:mb-2">
                  <Badge variant="outline" className="border-white/15 text-white/60 bg-white/5 backdrop-blur-2xl text-[10px] font-light px-4 py-1.5 rounded-full tracking-wide">
                    {business.sale_type === 'assets' && 'Vente d\'actifs'}
                    {business.sale_type === 'shares' && 'Vente d\'actions'}
                    {business.sale_type === 'both' && 'Flexible'}
                  </Badge>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Ligne de séparation élégante */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </motion.div>
    </div>
  );
};
