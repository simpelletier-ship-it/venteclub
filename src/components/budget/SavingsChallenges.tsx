import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trophy, Flame, Calendar, Plus, Check, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: "52-week" | "no-spend" | "custom";
  targetAmount: number;
  currentAmount: number;
  currentWeek: number;
  startDate: Date;
  isActive: boolean;
}

export const SavingsChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: "1",
      name: "Défi 52 semaines",
      description: "1$ sem.1, 2$ sem.2, etc.",
      type: "52-week",
      targetAmount: 1378,
      currentAmount: 465,
      currentWeek: 15,
      startDate: new Date(2024, 0, 1),
      isActive: true,
    },
  ]);

  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showWeekGrid, setShowWeekGrid] = useState(false);

  const handleMarkWeek = (weekIndex: number) => {
    if (!selectedChallenge) return;
    
    const weekAmount = weekIndex + 1;
    const newAmount = selectedChallenge.currentAmount + weekAmount;
    const newWeek = weekIndex + 1;
    
    setChallenges(prev => prev.map(c => 
      c.id === selectedChallenge.id 
        ? { ...c, currentAmount: newAmount, currentWeek: newWeek }
        : c
    ));
    
    setSelectedChallenge(prev => prev ? { ...prev, currentAmount: newAmount, currentWeek: newWeek } : null);
  };

  const availableChallenges = [
    { name: "52 semaines inversé", description: "Commence par 52$", targetAmount: 1378 },
    { name: "Défi des 5$", description: "Garde chaque 5$", targetAmount: 500 },
    { name: "Sans restaurant", description: "1 mois sans resto", targetAmount: 300 },
  ];

  const activeChallenge = challenges.find(c => c.isActive);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Défis d'épargne
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Active Challenge - Compact View */}
        {activeChallenge && (
          <Dialog open={showWeekGrid} onOpenChange={setShowWeekGrid}>
            <DialogTrigger asChild>
              <div 
                className="p-3 rounded-xl border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 cursor-pointer hover:shadow-md transition-all"
                onClick={() => setSelectedChallenge(activeChallenge)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{activeChallenge.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      <Flame className="w-3 h-3 mr-1 text-orange-500" />
                      Sem. {activeChallenge.currentWeek}
                    </Badge>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{formatPrice(activeChallenge.currentAmount)}</span>
                  <span>{formatPrice(activeChallenge.targetAmount)}</span>
                </div>
                <Progress 
                  value={(activeChallenge.currentAmount / activeChallenge.targetAmount) * 100} 
                  className="h-2"
                />
              </div>
            </DialogTrigger>

            {/* Week Grid Dialog */}
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  {selectedChallenge?.name}
                </DialogTitle>
              </DialogHeader>
              
              {selectedChallenge && (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <div className="text-2xl font-bold text-emerald-600">
                      {formatPrice(selectedChallenge.currentAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      sur {formatPrice(selectedChallenge.targetAmount)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Cliquez sur une semaine pour la marquer</p>
                    <div className="grid grid-cols-13 gap-1">
                      {Array(52).fill(0).map((_, i) => {
                        const isCompleted = i < selectedChallenge.currentWeek;
                        const weekAmount = i + 1;
                        return (
                          <button
                            key={i}
                            onClick={() => !isCompleted && handleMarkWeek(i)}
                            disabled={isCompleted || i !== selectedChallenge.currentWeek}
                            className={`
                              aspect-square rounded text-[9px] flex items-center justify-center transition-all
                              ${isCompleted 
                                ? "bg-emerald-500 text-white" 
                                : i === selectedChallenge.currentWeek
                                  ? "bg-amber-200 dark:bg-amber-800 ring-2 ring-amber-500 cursor-pointer hover:bg-amber-300"
                                  : "bg-muted text-muted-foreground"
                              }
                            `}
                            title={`Semaine ${i + 1}: ${weekAmount}$`}
                          >
                            {isCompleted ? <Check className="w-2 h-2" /> : weekAmount}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Semaines 1-52 • Prochaine: {selectedChallenge.currentWeek + 1}$
                    </p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* No Active Challenge */}
        {!activeChallenge && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">Aucun défi actif</p>
          </div>
        )}

        {/* Suggested Challenges - Compact */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Commencer un défi</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {availableChallenges.map((challenge, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="shrink-0 text-xs h-8"
                onClick={() => {
                  const newChallenge: Challenge = {
                    id: Date.now().toString(),
                    name: challenge.name,
                    description: challenge.description,
                    type: "custom",
                    targetAmount: challenge.targetAmount,
                    currentAmount: 0,
                    currentWeek: 0,
                    startDate: new Date(),
                    isActive: true,
                  };
                  setChallenges(prev => [...prev.map(c => ({ ...c, isActive: false })), newChallenge]);
                }}
              >
                <Plus className="w-3 h-3 mr-1" />
                {challenge.name}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
