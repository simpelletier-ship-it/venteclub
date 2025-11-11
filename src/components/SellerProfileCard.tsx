import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BadgeCheck, Zap, User } from "lucide-react";
import { motion } from "framer-motion";

interface SellerProfileCardProps {
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  bio?: string;
  responseTimeHours?: number;
  totalResponses: number;
  verifiedSeller: boolean;
  sellerSince: string;
  specialties?: string[];
}

export const SellerProfileCard = ({
  sellerId,
  sellerName,
  sellerAvatar,
  bio,
  responseTimeHours,
  totalResponses,
  verifiedSeller,
  sellerSince,
  specialties = []
}: SellerProfileCardProps) => {
  const navigate = useNavigate();
  
  // Calculer taux de réponse (simplifié)
  const responseRate = Math.min(100, Math.round((totalResponses / (totalResponses + 5)) * 100));
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/50 hover:border-primary/30 transition-all shadow-sm hover:shadow-md">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-border">
              <AvatarImage src={sellerAvatar} alt={sellerName} />
              <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary/20 to-accent/20">
                {sellerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-lg">{sellerName}</h3>
                {verifiedSeller && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="bg-blue-500 text-white gap-1 cursor-help">
                          <BadgeCheck className="w-3 h-3" />
                          Vérifié
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Profil complet et vérifié</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {responseTimeHours && responseTimeHours <= 2 && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="bg-amber-500 text-white gap-1 animate-pulse-glow cursor-help">
                          <Zap className="w-3 h-3" />
                          Réponse rapide
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Répond généralement en moins de {responseTimeHours}h</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              {bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {bio}
                </p>
              )}
              
              {specialties.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {specialties.slice(0, 3).map((specialty, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Separator />
          
          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{responseRate}%</div>
              <div className="text-xs text-muted-foreground">Taux de réponse</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {responseTimeHours || '--'}h
              </div>
              <div className="text-xs text-muted-foreground">Temps moyen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {new Date(sellerSince).getFullYear()}
              </div>
              <div className="text-xs text-muted-foreground">Membre depuis</div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate(`/seller/${sellerId}`)}
          >
            <User className="mr-2 w-4 h-4" />
            Voir le profil complet
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
