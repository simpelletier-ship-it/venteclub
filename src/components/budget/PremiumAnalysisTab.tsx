import { SubscriptionDetector } from "./SubscriptionDetector";
import { InterestAnalyzer } from "./InterestAnalyzer";
import { SavingsOpportunitiesDetector } from "./SavingsOpportunitiesDetector";
import { ScenarioSimulator } from "./ScenarioSimulator";
import { MonthlyComparisonChart } from "./MonthlyComparisonChart";
import { RetirementProjection } from "./RetirementProjection";

interface PremiumAnalysisTabProps {
  transactions: any[];
  categories: any[];
  debts: any[];
  assets: any[];
}

export const PremiumAnalysisTab = ({ transactions, categories, debts, assets }: PremiumAnalysisTabProps) => {
  return (
    <div className="space-y-6">
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

      <RetirementProjection />
    </div>
  );
};
