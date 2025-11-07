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
          className="flex items-center justify-between px-6 lg:px-16 pt-8 pb-4"
        >
          <div className="flex items-center gap-3">
            {business.created_at && (
              <div className="flex items-center gap-2.5 text-[13px] text-white/40 font-light tracking-wide">
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{new Date(business.created_at).toLocaleDateString('fr-CA', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {businessId && (
              <>
                <FavoriteButton businessId={businessId} userId={userId} />
                <ShareButton 
                  title={business.title} 
                  slug={business.slug} 
                  description={business.description}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/10 text-white/60 hover:text-white transition-all duration-300"
                />
              </>
            )}
            {!isSeller && businessId && (
              <ReportBusinessDialog businessId={businessId} businessTitle={business.title} />
            )}
          </div>
        </motion.div>

        {/* Contenu principal */}
        <div className="px-6 lg:px-16 py-12 lg:py-20">
          <div className="max-w-6xl">
            {/* Badges minimalistes */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap gap-3 mb-8"
            >
              {business.property_type ? (
                <Badge className="bg-white/8 text-white/90 border-white/15 backdrop-blur-2xl hover:bg-white/12 px-5 py-2.5 text-[13px] font-medium rounded-full transition-all duration-300 shadow-lg shadow-black/20">
                  Immobilier
                </Badge>
              ) : business.is_franchise ? (
                <Badge className="bg-purple-500/15 text-purple-100 border-purple-400/25 backdrop-blur-2xl hover:bg-purple-500/25 px-5 py-2.5 text-[13px] font-medium rounded-full transition-all duration-300 shadow-lg shadow-purple-900/30">
                  Franchise
                </Badge>
              ) : (
                <Badge className="bg-white/8 text-white/90 border-white/15 backdrop-blur-2xl hover:bg-white/12 px-5 py-2.5 text-[13px] font-medium rounded-full transition-all duration-300 shadow-lg shadow-black/20">
                  Entreprise
                </Badge>
              )}
              
              <div className="flex items-center gap-2.5 text-white/75 px-5 py-2.5 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 text-[13px] font-light shadow-lg shadow-black/20">
                <MapPin className="w-3.5 h-3.5" />
                {business.city || business.location}
              </div>
            </motion.div>

            {/* Titre premium */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-[clamp(2.25rem,6vw,4.5rem)] font-bold text-white mb-12 leading-[1.08] tracking-[-0.03em]"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
                fontFeatureSettings: '"ss01" on, "ss02" on'
              }}
            >
              {business.title}
            </motion.h1>

            {/* Prix élégant */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex flex-col"
            >
              <div className="text-[11px] text-white/35 font-light uppercase tracking-[0.25em] mb-3">
                Prix demandé
              </div>
              <div className="text-[clamp(3rem,8vw,5rem)] font-bold text-white tracking-[-0.04em] leading-none">
                {business.asking_price === 0 ? (
                  <span className="text-[clamp(2.5rem,6vw,4rem)]">À discuter</span>
                ) : (
                  <>
                    {business.asking_price.toLocaleString()}
                    <span className="text-[clamp(2rem,5vw,3.5rem)] font-light text-white/60 ml-2">$</span>
                  </>
                )}
              </div>
              
              {business.sale_type && (
                <div className="mt-6">
                  <Badge variant="outline" className="border-white/15 text-white/60 bg-white/5 backdrop-blur-2xl text-[11px] font-light px-5 py-2 rounded-full tracking-wide">
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
