import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Calendar, Plus, Check, Sparkles, Target } from "lucide-react";
import { motion } from "framer-motion";

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: "52-week" | "no-spend" | "custom" | "envelope";
  targetAmount: number;
  currentAmount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  weeklyProgress?: boolean[];
}

export const SavingsChallenges = () => {
  const [challenges] = useState<Challenge[]>([
    {
      id: "1",
      name: "Défi 52 semaines",
      description: "Économisez 1$ la première semaine, 2$ la deuxième, etc.",
      type: "52-week",
      targetAmount: 1378,
      currentAmount: 465,
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 11, 31),
      isActive: true,
      weeklyProgress: Array(52).fill(false).map((_, i) => i < 15),
    },
    {
      id: "2",
      name: "Mois sans dépenses",
      description: "Aucune dépense non-essentielle pendant 30 jours",
      type: "no-spend",
      targetAmount: 500,
      currentAmount: 320,
      startDate: new Date(2024, 0, 15),
      endDate: new Date(2024, 1, 15),
      isActive: true,
    },
    {
      id: "3",
      name: "Enveloppes budget",
      description: "Système d'enveloppes pour contrôler les dépenses",
      type: "envelope",
      targetAmount: 2000,
      currentAmount: 1450,
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 0, 31),
      isActive: true,
    },
  ]);

  const availableChallenges = [
    { name: "Défi 52 semaines inversé", description: "Commencez par 52$ et diminuez", icon: "📊" },
    { name: "Défi des 5$", description: "Économisez chaque billet de 5$", icon: "💵" },
    { name: "Semaine sans restaurant", description: "Cuisinez tous vos repas", icon: "🍳" },
    { name: "Défi sans café", description: "Pas de café acheté pendant 1 mois", icon: "☕" },
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            Défis d'épargne
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            Nouveau défi
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active challenges */}
        <div className="space-y-4">
          {challenges.filter(c => c.isActive).map((challenge, index) => {
            const progress = (challenge.currentAmount / challenge.targetAmount) * 100;
            const daysLeft = Math.ceil((challenge.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl border bg-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{challenge.name}</h4>
                      {challenge.type === "52-week" && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                          <Flame className="w-3 h-3 mr-1" />
                          15 semaines
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{challenge.description}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    <Calendar className="w-3 h-3 mr-1" />
                    {daysLeft}j restants
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{challenge.currentAmount.toFixed(0)}$ économisés</span>
                    <span className="text-muted-foreground">Objectif: {challenge.targetAmount}$</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* 52-week grid */}
                {challenge.type === "52-week" && challenge.weeklyProgress && (
                  <div className="mt-4 grid grid-cols-13 gap-1">
                    {challenge.weeklyProgress.slice(0, 26).map((completed, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded text-[8px] flex items-center justify-center ${
                          completed 
                            ? "bg-emerald-500 text-white" 
                            : "bg-muted"
                        }`}
                      >
                        {completed && <Check className="w-2 h-2" />}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Suggested challenges */}
        <div className="space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Défis suggérés
          </p>
          <div className="grid grid-cols-2 gap-2">
            {availableChallenges.map((challenge, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{challenge.icon}</span>
                  <span className="text-sm font-medium">{challenge.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{challenge.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-amber-600" />
            <span className="font-medium">Badges gagnés</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
              🔥 Série de 7 jours
            </Badge>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
              💰 Premier 100$
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
              📊 Budget maîtrisé
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
