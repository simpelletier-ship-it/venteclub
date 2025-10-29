import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Linkedin, Twitter } from "lucide-react";

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
            <div className="flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                 className="text-muted-foreground hover:text-accent transition-colors"
                 aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-accent transition-colors"
                 aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-accent transition-colors"
                 aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-bold text-lg mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-muted-foreground hover:text-accent transition-colors">Accueil</Link></li>
              <li><Link to="/map" className="text-sm text-muted-foreground hover:text-accent transition-colors">Carte interactive</Link></li>
              <li><Link to="/list-business" className="text-sm text-muted-foreground hover:text-accent transition-colors">Vendre une entreprise</Link></li>
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

          {/* Contact Info (NAP) */}
          <div>
            <h3 className="font-bold text-lg mb-4">Coordonnées</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>Vente.Club Inc.</p>
                  <p>1250 Rue René-Lévesque O</p>
                  <p>Montréal, QC H3B 4W8</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-accent flex-shrink-0" />
                <a href="tel:+15148501234" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  (514) 850-1234
                </a>
              </div>
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
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "1250 Rue René-Lévesque O",
            "addressLocality": "Montréal",
            "addressRegion": "QC",
            "postalCode": "H3B 4W8",
            "addressCountry": "CA"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+1-514-850-1234",
            "contactType": "Customer Service",
            "areaServed": "CA-QC",
            "availableLanguage": ["French", "English"]
          },
          "sameAs": [
            "https://facebook.com/venteclub",
            "https://linkedin.com/company/venteclub",
            "https://twitter.com/venteclub"
          ]
        })}
      </script>
    </footer>
  );
};