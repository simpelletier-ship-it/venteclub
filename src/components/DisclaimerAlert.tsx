import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const DisclaimerAlert = () => {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="font-bold">Avis Important - Décharge de responsabilité</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>
          <strong>Vente.Club est une plateforme de mise en relation uniquement.</strong> Nous ne sommes pas partie prenante 
          dans les transactions et n'assumons aucune responsabilité quant à:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>L'exactitude des informations présentées dans les annonces</li>
          <li>La qualité, la légalité ou la conformité des entreprises vendues</li>
          <li>Les accords financiers ou contractuels entre acheteurs et vendeurs</li>
          <li>Les litiges, pertes ou dommages découlant des transactions</li>
        </ul>
        <p className="font-semibold mt-3">
          ⚠️ FAITES PREUVE DE DILIGENCE RAISONNABLE - Il est impératif de:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Vérifier toutes les informations financières et opérationnelles</li>
          <li>Consulter des professionnels (avocat, comptable, évaluateur d'entreprise)</li>
          <li>Effectuer une vérification diligente approfondie avant tout engagement</li>
          <li>Ne jamais effectuer de paiement sans garanties contractuelles appropriées</li>
          <li>Vérifier la conformité légale et réglementaire de l'entreprise</li>
        </ul>
        <p className="mt-3 font-semibold">
          En utilisant cette plateforme, vous reconnaissez et acceptez ces conditions. 
          Vente.Club ne garantit aucun résultat et décline toute responsabilité.
        </p>
      </AlertDescription>
    </Alert>
  );
};
