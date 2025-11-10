import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface NextStep {
  icon: LucideIcon;
  text: string;
  action: string;
}

interface VisibilityScoreCardProps {
  score: number;
  nextSteps?: NextStep[];
}

const VisibilityScoreCard = ({ score, nextSteps = [] }: VisibilityScoreCardProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreColor = () => {
    if (score === 0) return "text-muted-foreground";
    if (score < 50) return "text-muted-foreground/80";
    if (score < 80) return "text-foreground/90";
    return "text-foreground";
  };

  const getProgressColor = () => {
    if (score === 0) return "[&>div]:bg-muted";
    if (score < 50) return "[&>div]:bg-muted-foreground/30";
    if (score < 80) return "[&>div]:bg-muted-foreground/60";
    return "[&>div]:bg-foreground";
  };

  const getScoreLabel = () => {
    if (score === 0) return "Non commencé";
    if (score < 50) return "À compléter";
    if (score < 80) return "En cours";
    return "Optimal";
  };

  return (
    <div className="bg-card rounded-lg border border-border sticky top-24">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Visibilité</h3>
          <div className="flex items-baseline gap-1">
            <span 
              className={`text-4xl font-semibold tracking-tight transition-all duration-700 ${getScoreColor()}`}
              style={{ 
                transform: `scale(${animatedScore > 0 ? 1 : 0.95})`,
                opacity: animatedScore > 0 ? 1 : 0.5
              }}
            >
              {animatedScore}
            </span>
            <span className="text-lg text-muted-foreground">%</span>
          </div>
        </div>

        {/* Progress bar */}
        <Progress 
          value={animatedScore} 
          className={`h-1.5 transition-all duration-700 ease-out ${getProgressColor()}`}
        />

        {/* Score label */}
        <p className="text-xs text-muted-foreground mt-3 transition-opacity duration-500">
          {getScoreLabel()}
        </p>
      </div>

      {/* Next steps */}
      {nextSteps.length > 0 && (
        <div className="px-6 pb-6 pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground">
              À compléter
            </p>
            <span className="text-xs text-muted-foreground">
              {nextSteps.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {nextSteps.map((step, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-muted/50 text-xs"
                onClick={() => {
                  const element = document.getElementById(step.action);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  element?.focus();
                }}
              >
                <step.icon className="w-3.5 h-3.5 mr-2.5 flex-shrink-0 text-muted-foreground" />
                <span className="flex-1 text-foreground/80">{step.text}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisibilityScoreCard;
