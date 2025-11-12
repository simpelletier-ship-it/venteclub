import { SubscriptionDetector } from "./SubscriptionDetector";
import { InterestAnalyzer } from "./InterestAnalyzer";
import { SavingsOpportunitiesDetector } from "./SavingsOpportunitiesDetector";
import { Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PremiumAnalysisTabProps {
  transactions: any[];
  categories: any[];
  debts: any[];
}

export const PremiumAnalysisTab = ({ transactions, categories, debts }: PremiumAnalysisTabProps) => {
  return (
    <div className="space-y-6">
      <Alert className="border-primary/50 bg-primary/5">
        <Sparkles className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong className="font-semibold">Analyses Premium</strong> - Découvrez des insights avancés pour maximiser vos économies et optimiser votre santé financière.
        </AlertDescription>
      </Alert>

      <SubscriptionDetector transactions={transactions} categories={categories} />
      
      {debts.length > 0 && (
        <InterestAnalyzer debts={debts} />
      )}
      
      <SavingsOpportunitiesDetector transactions={transactions} categories={categories} />
    </div>
  );
};
