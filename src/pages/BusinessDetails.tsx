import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, MapPin, TrendingUp, Users, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import venteLogo from "@/assets/vente-logo.png";

const BusinessDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPlansDialog, setShowPlansDialog] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAccess(session.user.id);
      } else {
        setLoading(false);
      }
    });
    fetchBusiness();
    fetchPlans();
  }, [id]);

  const fetchBusiness = async () => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setBusiness(data);
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

  const checkAccess = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("business_inquiries")
        .select("*")
        .eq("business_id", id)
        .eq("buyer_id", userId)
        .maybeSingle();

      if (error) throw error;
      setHasAccess(!!data);
    } catch (error: any) {
      console.error(error);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price");

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleUnlockAccess = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setShowPlansDialog(true);
  };

  const handlePurchasePlan = async (planId: string) => {
    toast({
      title: "Fonctionnalité à venir",
      description: "L'intégration de paiement Stripe sera ajoutée prochainement.",
    });
    setShowPlansDialog(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Entreprise non trouvée</p>
          <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const isSeller = user?.id === business.seller_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <img
            src={venteLogo}
            alt="Vente.club"
            className="h-10 cursor-pointer"
            onClick={() => navigate("/")}
          />
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl shadow-elegant border border-border/50 overflow-hidden">
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {business.title}
                  </h1>
                  <div className="flex flex-wrap gap-2 items-center text-muted-foreground">
                    <Badge variant="secondary">{business.industry}</Badge>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {business.location}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-accent">
                    {business.asking_price.toLocaleString()}€
                  </div>
                  <div className="text-sm text-muted-foreground">Prix demandé</div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {business.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {business.annual_revenue && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">Revenu annuel</span>
                      </div>
                      <div className="text-xl font-semibold">
                        {business.annual_revenue.toLocaleString()}€
                      </div>
                    </div>
                  )}
                  {business.profit_margin && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">
                        Marge de profit
                      </div>
                      <div className="text-xl font-semibold">
                        {business.profit_margin}%
                      </div>
                    </div>
                  )}
                  {business.employees_count && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">Employés</span>
                      </div>
                      <div className="text-xl font-semibold">
                        {business.employees_count}
                      </div>
                    </div>
                  )}
                  {business.year_established && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Année</span>
                      </div>
                      <div className="text-xl font-semibold">
                        {business.year_established}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Informations du vendeur
                  </h2>
                  {isSeller || hasAccess ? (
                    <div className="bg-muted/30 p-6 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Contact du vendeur :
                      </p>
                      <p className="font-semibold">
                        [Informations de contact complètes disponibles]
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6 rounded-lg text-center">
                      <Lock className="w-12 h-12 mx-auto mb-4 text-accent" />
                      <h3 className="text-lg font-semibold mb-2">
                        Accès premium requis
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Débloquez les informations complètes du vendeur pour
                        entrer en contact
                      </p>
                      <Button size="lg" onClick={handleUnlockAccess}>
                        Débloquer l'accès
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPlansDialog} onOpenChange={setShowPlansDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Choisissez votre forfait</DialogTitle>
            <DialogDescription>
              Achetez des crédits pour accéder aux informations des vendeurs
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="border border-border rounded-lg p-6 flex flex-col"
              >
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-accent mb-2">
                  {plan.price}€
                </div>
                <p className="text-sm text-muted-foreground mb-4 flex-1">
                  {plan.description}
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="text-sm">
                    ✓ {plan.credits} crédits d'accès
                  </li>
                  <li className="text-sm">
                    ✓ Valide {plan.duration_days} jours
                  </li>
                </ul>
                <Button
                  onClick={() => handlePurchasePlan(plan.id)}
                  className="w-full"
                >
                  Acheter
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessDetails;
