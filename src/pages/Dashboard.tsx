import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, LogOut, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import BusinessCard from "@/components/BusinessCard";
import venteLogo from "@/assets/vente-logo.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredDialogOpen, setFeaturedDialogOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchUserBusinesses(session.user.id);
      }
    });

    // Check for payment success/cancel
    if (searchParams.get('featured_success') === 'true') {
      toast({
        title: "Paiement réussi!",
        description: "Votre annonce sera mise en avant sous peu.",
      });
      setSearchParams({});
    } else if (searchParams.get('featured_canceled') === 'true') {
      toast({
        variant: "destructive",
        title: "Paiement annulé",
        description: "Vous avez annulé le paiement.",
      });
      setSearchParams({});
    }
  }, [navigate, searchParams, setSearchParams, toast]);

  const fetchUserBusinesses = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleFeatureClick = (business: any) => {
    setSelectedBusiness(business);
    setFeaturedDialogOpen(true);
  };

  const handleFeaturePayment = async () => {
    if (!selectedBusiness) return;

    setProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-featured-checkout', {
        body: { businessId: selectedBusiness.id }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        setFeaturedDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer la session de paiement",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <img src={venteLogo} alt="Vente.club" className="h-10 cursor-pointer" onClick={() => navigate("/")} />
          <div className="flex gap-4">
            <Button onClick={() => navigate("/list-business")}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle annonce
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Mes annonces
          </h1>
          <p className="text-muted-foreground">
            Gérez vos entreprises à vendre
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore d'annonces
            </p>
            <Button onClick={() => navigate("/list-business")}>
              <Plus className="mr-2 h-4 w-4" />
              Créer ma première annonce
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <div key={business.id} className="relative">
                <BusinessCard {...business} />
                {!business.featured && (
                  <Button
                    onClick={() => handleFeatureClick(business)}
                    className="absolute top-4 right-4 z-10"
                    size="sm"
                    variant="secondary"
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Mettre en avant
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={featuredDialogOpen} onOpenChange={setFeaturedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre votre annonce en avant</DialogTitle>
            <DialogDescription>
              Mettez votre annonce en vedette avec une étoile dorée pour 20$ CAD.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-secondary/20 p-4 rounded-lg border border-border">
              <h3 className="font-semibold mb-2">{selectedBusiness?.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Votre annonce sera mise en avant pendant 30 jours ou jusqu'à ce que 3 nouvelles annonces soient promues après la vôtre.
              </p>
              <div className="flex items-center gap-2 text-primary">
                <Star className="h-5 w-5 fill-current" />
                <span className="font-bold">20$ CAD</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">✨ Votre annonce apparaîtra en haut avec une étoile dorée</p>
              <p className="mb-2">🎯 Maximum 3 annonces en avant en même temps</p>
              <p>⏱️ Valide 30 jours ou jusqu'à être déplacée par de nouvelles annonces</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleFeaturePayment} 
              disabled={processingPayment}
              className="flex-1"
            >
              {processingPayment ? "Traitement..." : "Payer 20$ CAD"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setFeaturedDialogOpen(false)}
              disabled={processingPayment}
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
