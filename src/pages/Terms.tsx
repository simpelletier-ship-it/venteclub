import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Conditions d'utilisation | Vente.Club"
        description="Conditions d'utilisation de la plateforme Vente.Club"
        canonical="/terms"
      />

      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-6 -ml-2 hover:bg-muted"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 leading-tight tracking-tight">
              Conditions d'utilisation
            </h1>

            <div className="prose prose-base md:prose-lg max-w-none space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>

              <section className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold mt-8 mb-4">1. Acceptation des conditions</h2>
                <p className="text-foreground/90 leading-relaxed">
                  En créant un compte et en utilisant la plateforme Vente.Club, vous acceptez les présentes conditions d'utilisation. 
                  Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold mt-8 mb-4">2. Responsabilité de la plateforme</h2>
                <div className="p-6 bg-muted/20 rounded-lg border-l-4 border-primary">
                  <p className="text-foreground font-semibold mb-3">
                    En créant un compte, vous reconnaissez que Vente.Club n'est aucunement responsable des annonces publiées sur la plateforme et ne peut être reconnu comme ayant commis une faute.
                  </p>
                  <p className="text-foreground/90 leading-relaxed">
                    Vente.Club est une plateforme de mise en relation entre vendeurs et acheteurs d'entreprises. Nous ne vérifions pas, ne garantissons pas et ne sommes pas responsables de l'exactitude, de l'exhaustivité ou de la légalité des annonces publiées par les utilisateurs.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold mt-8 mb-4">3. Obligations de l'utilisateur</h2>
                <p className="text-foreground/90 leading-relaxed mb-3">
                  Vous devez agir avec prudence lors de l'achat d'une entreprise et effectuer vos propres vérifications, notamment :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                  <li>Vérifier l'exactitude des informations fournies par le vendeur</li>
                  <li>Effectuer une diligence raisonnable complète (due diligence)</li>
                  <li>Consulter des professionnels qualifiés (avocats, comptables, conseillers financiers)</li>
                  <li>Vérifier la légalité de la transaction et la conformité réglementaire</li>
                  <li>Obtenir toutes les autorisations et licences nécessaires</li>
                  <li>Analyser les états financiers et la situation économique de l'entreprise</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold mt-8 mb-4">4. Utilisation de la plateforme</h2>
                <p className="text-foreground/90 leading-relaxed">
                  En utilisant Vente.Club, vous vous engagez à :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                  <li>Fournir des informations exactes et à jour</li>
                  <li>Ne pas publier de contenu illégal, trompeur ou frauduleux</li>
                  <li>Respecter les droits de propriété intellectuelle d'autrui</li>
                  <li>Ne pas utiliser la plateforme à des fins illégales</li>
                  <li>Maintenir la confidentialité de vos identifiants de connexion</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold mt-8 mb-4">5. Limitation de responsabilité</h2>
                <p className="text-foreground/90 leading-relaxed">
                  Vente.Club ne peut être tenu responsable :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                  <li>Des dommages directs ou indirects résultant de l'utilisation de la plateforme</li>
                  <li>Des pertes financières liées aux transactions entre utilisateurs</li>
                  <li>De l'exactitude, de la fiabilité ou de l'exhaustivité des annonces</li>
                  <li>Des litiges entre acheteurs et vendeurs</li>
                  <li>Des interruptions de service ou des défaillances techniques</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold mt-8 mb-4">6. Protection des données</h2>
                <p className="text-foreground/90 leading-relaxed">
                  Vos données personnelles sont collectées et traitées conformément à notre politique de confidentialité. 
                  En utilisant notre plateforme, vous consentez à ce traitement.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold mt-8 mb-4">7. Modification des conditions</h2>
                <p className="text-foreground/90 leading-relaxed">
                  Vente.Club se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés 
                  des modifications importantes par email ou via un avis sur la plateforme.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold mt-8 mb-4">8. Résiliation</h2>
                <p className="text-foreground/90 leading-relaxed">
                  Vente.Club se réserve le droit de suspendre ou de résilier votre compte en cas de violation des présentes 
                  conditions d'utilisation, sans préavis et sans indemnité.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold mt-8 mb-4">9. Droit applicable</h2>
                <p className="text-foreground/90 leading-relaxed">
                  Les présentes conditions sont régies par les lois en vigueur au Québec, Canada. Tout litige sera soumis 
                  à la compétence exclusive des tribunaux du Québec.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold mt-8 mb-4">10. Contact</h2>
                <p className="text-foreground/90 leading-relaxed">
                  Pour toute question concernant ces conditions d'utilisation, veuillez nous contacter via notre page de contact.
                </p>
              </section>
            </div>

            <div className="mt-12 p-6 md:p-8 bg-muted/20 rounded-lg border-l-4 border-primary">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Important :</strong> Ces conditions d'utilisation constituent un accord juridique entre vous et Vente.Club. 
                Veuillez les lire attentivement et consulter un professionnel juridique si vous avez des questions.
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default Terms;
