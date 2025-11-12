import { SubscriptionDetector } from "./SubscriptionDetector";
import { InterestAnalyzer } from "./InterestAnalyzer";
import { SavingsOpportunitiesDetector } from "./SavingsOpportunitiesDetector";
import { FinancialHealthScore } from "./FinancialHealthScore";
import { ScenarioSimulator } from "./ScenarioSimulator";
import { MonthlyComparisonChart } from "./MonthlyComparisonChart";
import { Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PremiumAnalysisTabProps {
  transactions: any[];
  categories: any[];
  debts: any[];
  assets: any[];
}

export const PremiumAnalysisTab = ({ transactions, categories, debts, assets }: PremiumAnalysisTabProps) => {
  return (
    <div className="space-y-6">
      <Alert className="border-primary/50 bg-primary/5">
        <Sparkles className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong className="font-semibold">Analyses Avancées</strong> - Découvrez des insights avancés gratuits pour maximiser vos économies et optimiser votre santé financière.
        </AlertDescription>
      </Alert>

      <FinancialHealthScore 
        transactions={transactions}
        debts={debts}
        assets={assets}
      />

      <ScenarioSimulator 
        transactions={transactions}
        assets={assets}
        debts={debts}
        categories={categories}
        goals={[]}
      />

      <MonthlyComparisonChart transactions={transactions} />

      <SubscriptionDetector transactions={transactions} categories={categories} />
      
      {debts.length > 0 && (
        <InterestAnalyzer debts={debts} />
      )}
      
      <SavingsOpportunitiesDetector transactions={transactions} categories={categories} />
    </div>
  );
};
