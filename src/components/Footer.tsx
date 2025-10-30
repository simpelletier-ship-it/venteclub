import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* À propos */}
          <div>
            <h3 className="font-bold text-lg mb-4">Vente.Club</h3>
            <p className="text-sm text-muted-foreground mb-4">
              La plateforme québécoise de référence pour l'achat et la vente d'entreprises. 
              Transactions sécurisées, vérification rigoureuse, accompagnement professionnel.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-bold text-lg mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-muted-foreground hover:text-accent transition-colors">Accueil</Link></li>
              <li><Link to="/map" className="text-sm text-muted-foreground hover:text-accent transition-colors">Carte interactive</Link></li>
              <li><Link to="/list-business" className="text-sm text-muted-foreground hover:text-accent transition-colors">Vendre une entreprise</Link></li>
              <li><Link to="/list-franchise" className="text-sm text-muted-foreground hover:text-accent transition-colors">Vendre une franchise</Link></li>
              <li><Link to="/list-property" className="text-sm text-muted-foreground hover:text-accent transition-colors">Vendre un immeuble</Link></li>
              <li><Link to="/a-propos" className="text-sm text-muted-foreground hover:text-accent transition-colors">À propos</Link></li>
              <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-accent transition-colors">Contact</Link></li>
              <li><Link to="/blog" className="text-sm text-muted-foreground hover:text-accent transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Régions */}
          <div>
            <h3 className="font-bold text-lg mb-4">Régions</h3>
            <ul className="space-y-2">
              <li><Link to="/entreprises-a-vendre-montreal" className="text-sm text-muted-foreground hover:text-accent transition-colors">Montréal</Link></li>
              <li><Link to="/entreprises-a-vendre-quebec" className="text-sm text-muted-foreground hover:text-accent transition-colors">Québec</Link></li>
              <li><Link to="/entreprises-a-vendre-laval" className="text-sm text-muted-foreground hover:text-accent transition-colors">Laval</Link></li>
              <li><Link to="/entreprises-a-vendre-gatineau" className="text-sm text-muted-foreground hover:text-accent transition-colors">Gatineau</Link></li>
              <li><Link to="/entreprises-a-vendre-sherbrooke" className="text-sm text-muted-foreground hover:text-accent transition-colors">Sherbrooke</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">Coordonnées</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Contactez-nous si vous avez des questions:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-accent flex-shrink-0" />
                <a href="mailto:info@vente.club" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  info@vente.club
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Vente.Club. Tous droits réservés.
            </p>
            <div className="flex gap-6">
              <Link to="/confidentialite" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                Politique de confidentialité
              </Link>
              <Link to="/conditions" className="text-sm text-muted-foreground hover:text-accent transition-colors">
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