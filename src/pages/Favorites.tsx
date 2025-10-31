import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import BusinessCard from "@/components/BusinessCard";

const Favorites = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    fetchFavorites(session.user.id);
  };

  const fetchFavorites = async (userId: string) => {
    try {
      // Get favorite business IDs
      const { data: favoriteIds, error: favError } = await supabase
        .from('business_favorites')
        .select('business_id')
        .eq('user_id', userId);

      if (favError) throw favError;

      if (!favoriteIds || favoriteIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Get businesses details
      const businessIds = favoriteIds.map(f => f.business_id);
      const { data: businesses, error: bizError } = await supabase
        .from('businesses')
        .select('*')
        .in('id', businessIds)
        .eq('status', 'active')
        .eq('approval_status', 'approved');

      if (bizError) throw bizError;

      // No need to check featured status - use the featured column directly
      setFavorites(businesses || []);
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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Mes Annonces Sauvegardées
          </h1>
          <p className="text-muted-foreground">
            Retrouvez toutes les entreprises que vous suivez
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore d'annonces sauvegardées
            </p>
            <Button onClick={() => navigate("/")}>
              Explorer les annonces
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((business) => (
              <BusinessCard key={business.id} {...business} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
