import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FavoriteButtonProps {
  businessId: string;
  userId: string | undefined;
}

export const FavoriteButton = ({ businessId, userId }: FavoriteButtonProps) => {
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      checkFavorite();
    }
  }, [userId, businessId]);

  const checkFavorite = async () => {
    const { data } = await supabase
      .from('business_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .single();
    
    setIsFavorite(!!data);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter des favoris.",
      });
      return;
    }

    setLoading(true);

    try {
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('business_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('business_id', businessId);
        
        setIsFavorite(false);
        toast({
          title: "Retiré des favoris",
          description: "L'annonce a été retirée de vos favoris.",
        });
      } else {
        // Add to favorites
        await supabase
          .from('business_favorites')
          .insert({
            user_id: userId,
            business_id: businessId,
          });
        
        setIsFavorite(true);
        toast({
          title: "Ajouté aux favoris",
          description: "Vous serez notifié des changements de prix et autres mises à jour.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      disabled={loading}
      className={isFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"}
    >
      <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
    </Button>
  );
};
