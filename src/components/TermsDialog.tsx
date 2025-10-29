import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TermsDialog = ({ open, onOpenChange }: TermsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Contrat d&apos;utilisation - Vente.Club</DialogTitle>
          <DialogDescription>
            Veuillez lire attentivement les conditions avant de publier votre annonce
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-lg mb-2">Entre :</h3>
              <p className="text-muted-foreground">
                La plateforme <strong>vente.club</strong>, exploitée par Vente Club, ci-après désignée « <strong>la Plateforme</strong> »,
              </p>
              <h3 className="font-semibold text-lg mt-4 mb-2">Et :</h3>
              <p className="text-muted-foreground">
                Toute personne physique ou morale utilisant la Plateforme pour publier une annonce de vente d&apos;entreprise, 
                ci-après désignée « <strong>l&apos;Utilisateur</strong> »,
              </p>
              <p className="mt-4">Il est convenu ce qui suit :</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">1. Objet du contrat</h3>
              <p className="text-muted-foreground">
                Le présent contrat a pour objet de définir les conditions dans lesquelles l&apos;Utilisateur peut publier 
                une entreprise à vendre sur la Plateforme vente.club, ainsi que les droits et obligations des parties.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">2. Consentement au partage des informations de contact</h3>
              <p className="text-muted-foreground mb-2">
                En publiant une annonce sur vente.club, l&apos;Utilisateur autorise expressément la Plateforme à transmettre, 
                partager ou céder ses informations de contact (notamment nom, courriel et numéro de téléphone) à des tiers 
                intéressés, uniquement dans le but de permettre une prise de contact relative à la vente de son entreprise.
              </p>
              <p className="text-muted-foreground mb-2">
                Ce partage est limité à cet usage précis et ne constitue pas une revente de données à des fins publicitaires.
              </p>
              <p className="text-muted-foreground">
                L&apos;Utilisateur reconnaît que cette transmission est nécessaire au fonctionnement du service et renonce à toute 
                réclamation à ce sujet, dès lors qu&apos;elle respecte le présent contrat.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">3. Confidentialité et protection des données personnelles</h3>
              <p className="text-muted-foreground mb-2">
                La Plateforme vente.club s&apos;engage à traiter toutes les données personnelles conformément à la 
                <strong> Loi canadienne sur la protection des renseignements personnels et les documents électroniques (LPRPDE)</strong> 
                ainsi qu&apos;au <strong>Règlement Général sur la Protection des Données (RGPD)</strong> pour les utilisateurs européens.
              </p>
              <p className="text-muted-foreground mb-2">Les données collectées sont utilisées uniquement pour :</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>publier et gérer les annonces de vente d&apos;entreprises ;</li>
                <li>permettre la mise en relation entre vendeurs et acheteurs ;</li>
                <li>prévenir la fraude et améliorer le service.</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Aucune donnée ne sera vendue, louée ou transférée à des tiers à des fins publicitaires sans consentement explicite.
              </p>
              <p className="text-muted-foreground mt-2">
                L&apos;Utilisateur peut à tout moment demander l&apos;accès, la rectification ou la suppression de ses données 
                en écrivant à : <strong>support@vente.club</strong>
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">4. Rôle de la Plateforme</h3>
              <p className="text-muted-foreground mb-2">
                La Plateforme vente.club agit uniquement comme un intermédiaire technique permettant la mise en relation 
                entre vendeurs et acheteurs.
              </p>
              <p className="text-muted-foreground mb-2">
                Elle n&apos;intervient pas dans les négociations, ne garantit pas la fiabilité des informations publiées 
                et ne peut être considérée comme partie à la transaction.
              </p>
              <p className="text-muted-foreground">
                Chaque Utilisateur est responsable du contenu de son annonce et de la vérification des informations 
                communiquées par d&apos;autres utilisateurs.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">5. Responsabilité</h3>
              <p className="text-muted-foreground mb-2">
                La Plateforme, ses administrateurs, dirigeants et partenaires ne pourront être tenus responsables de tout 
                dommage direct ou indirect, perte financière, fraude, arnaque, usurpation d&apos;identité, ou préjudice découlant :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>d&apos;une transaction conclue ou refusée entre utilisateurs ;</li>
                <li>d&apos;une information fausse ou trompeuse publiée sur le site ;</li>
                <li>ou de toute utilisation du service.</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                L&apos;Utilisateur reconnaît utiliser vente.club à ses propres risques et s&apos;engage à faire preuve de prudence 
                et de diligence avant toute transaction.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">6. Acceptation du contrat</h3>
              <p className="text-muted-foreground mb-2">
                Avant la mise en ligne d&apos;une annonce, l&apos;Utilisateur doit accepter expressément le présent contrat.
              </p>
              <p className="text-muted-foreground mb-2">
                En cochant la case d&apos;acceptation ou en publiant son annonce, il reconnaît :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>avoir lu et compris le présent contrat ;</li>
                <li>consentir au partage de ses informations de contact ;</li>
                <li>accepter que la Plateforme ne soit pas responsable en cas de fraude ou de perte ;</li>
                <li>comprendre que vente.club agit uniquement comme intermédiaire technique.</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Cette acceptation a valeur de consentement contractuel et engage pleinement l&apos;Utilisateur.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">7. Durée et résiliation</h3>
              <p className="text-muted-foreground mb-2">
                Le contrat prend effet dès l&apos;acceptation par l&apos;Utilisateur et demeure en vigueur tant que l&apos;annonce 
                est active sur vente.club.
              </p>
              <p className="text-muted-foreground mb-2">
                L&apos;Utilisateur peut retirer son annonce à tout moment via son tableau de bord.
              </p>
              <p className="text-muted-foreground">
                La Plateforme se réserve le droit de supprimer sans préavis toute annonce frauduleuse, incomplète ou non conforme.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">8. Droit applicable</h3>
              <p className="text-muted-foreground mb-2">
                Le présent contrat est régi par les lois en vigueur dans la province de Québec (Canada).
              </p>
              <p className="text-muted-foreground">
                Tout litige relatif à son interprétation ou à son exécution relève de la compétence exclusive des tribunaux 
                du district judiciaire de Montréal.
              </p>
            </section>

            <section className="bg-accent/10 p-4 rounded-lg border border-accent/20">
              <h3 className="font-semibold text-lg mb-2 text-accent">✅ Clause d&apos;acceptation</h3>
              <p className="text-muted-foreground">
                En publiant mon annonce sur vente.club, je confirme avoir lu, compris et accepté le Contrat d&apos;utilisation, 
                incluant le partage de mes coordonnées pour contact commercial et la décharge de responsabilité de la plateforme.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
