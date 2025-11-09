import { Link } from "react-router-dom";
import { Mail, Shield, Lock } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-16 sm:mt-20">
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
          {/* À propos */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Vente.Club</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
              La plateforme québécoise de référence pour l'achat et la vente d'entreprises.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Navigation</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><Link to="/" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors">Accueil</Link></li>
              <li><Link to="/entreprises" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors">Entreprises à vendre</Link></li>
              <li><Link to="/marche" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors">Marché 2025</Link></li>
              <li><Link to="/faq" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors">FAQ</Link></li>
              <li><Link to="/a-propos" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors">À propos</Link></li>
              <li><Link to="/blog" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors">Blog</Link></li>
              <li><Link to="/ressources" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors">Ressources</Link></li>
            </ul>
          </div>

          {/* Régions & Vendre */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Régions & Services</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><Link to="/entreprises-a-vendre-montreal" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors">Entreprises Montréal</Link></li>
              <li><Link to="/entreprises-a-vendre-quebec" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors">Entreprises Québec</Link></li>
              <li><Link to="/entreprises-a-vendre-laval" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors">Entreprises Laval</Link></li>
              <li><Link to="/list-business" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors">Vendre une entreprise</Link></li>
              <li><Link to="/list-franchise" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors">Vendre une franchise</Link></li>
              <li><Link to="/list-property" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors">Vendre un immeuble</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Coordonnées</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 leading-relaxed">
              Contactez-nous si vous avez des questions:
            </p>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                <a href="mailto:info@vente.club" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors break-all">
                  info@vente.club
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 sm:mt-10 lg:mt-12 pt-6 sm:pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4">
              <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
                © {new Date().getFullYear()} Vente.Club. Tous droits réservés.
              </p>
              {/* Security Badge */}
              <Link 
                to="/admin/compliance" 
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors"
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium text-green-700 dark:text-green-400 whitespace-nowrap">
                  Certifié PCI DSS Level 1
                </span>
                <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500 flex-shrink-0" />
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
              <Link to="/confidentialite" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors text-center">
                Politique de confidentialité
              </Link>
              <Link to="/conditions" className="text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors text-center">
                Conditions d'utilisation
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Data for Organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Vente.Club",
          "url": "https://vente.club",
          "logo": "https://vente.club/vente-logo.png",
          "description": "Plateforme québécoise pour l'achat et la vente d'entreprises",
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "info@vente.club",
            "contactType": "Customer Service",
            "areaServed": "CA-QC",
            "availableLanguage": ["French", "English"]
          }
        })}
      </script>
    </footer>
  );
};