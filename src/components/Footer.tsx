import { Link } from "react-router-dom";
import { Mail, Shield, Lock, PiggyBank, Calculator, Receipt, Building2 } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-muted border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="font-semibold text-base text-foreground">
                Vente<span className="text-primary">.club</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Vente.club – la plateforme qui clarifie vos finances.
            </p>
          </div>

          {/* Budget & Tools */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Outils financiers</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/budget" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-primary" />
                  Planificateur de budget
                </Link>
              </li>
              <li>
                <Link to="/outils/salaire" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  Calculateur de salaire
                </Link>
              </li>
              <li>
                <Link to="/outils/retour-impot" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  Retour d'impôt
                </Link>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Ressources</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <a href="mailto:info@vente.club" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  info@vente.club
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Vente.club. Tous droits réservés.
              </p>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-success/10">
                <Shield className="h-4 w-4 text-success" />
                <span className="text-xs font-medium text-success">
                  Données sécurisées
                </span>
                <Lock className="h-3 w-3 text-success" />
              </div>
            </div>
            <div className="flex gap-6">
              <Link to="/confidentialite" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Confidentialité
              </Link>
              <Link to="/conditions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
