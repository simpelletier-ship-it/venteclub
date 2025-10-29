import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import venteLogo from "@/assets/vente-logo.png";
import { businessSchema } from "@/lib/validations";

const ListBusiness = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    industry: "",
    location: "",
    annual_revenue: "",
    asking_price: "",
    profit_margin: "",
    employees_count: "",
    year_established: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate with Zod
      const validatedData = businessSchema.parse({
        title: formData.title,
        description: formData.description,
        industry: formData.industry,
        location: formData.location,
        annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null,
        asking_price: parseFloat(formData.asking_price),
        profit_margin: formData.profit_margin ? parseFloat(formData.profit_margin) : null,
        employees_count: formData.employees_count ? parseInt(formData.employees_count) : null,
        year_established: formData.year_established ? parseInt(formData.year_established) : null,
      });

      const { error } = await supabase.from("businesses").insert({
        seller_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        industry: validatedData.industry,
        location: validatedData.location,
        annual_revenue: validatedData.annual_revenue,
        asking_price: validatedData.asking_price,
        profit_margin: validatedData.profit_margin,
        employees_count: validatedData.employees_count,
        year_established: validatedData.year_established,
        status: "active",
      });

      if (error) throw error;

      toast({
        title: "Succès !",
        description: "Votre entreprise a été listée avec succès.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        error.errors.forEach((err: any) => {
          toast({
            variant: "destructive",
            title: "Erreur de validation",
            description: err.message,
          });
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <img src={venteLogo} alt="Vente.club" className="h-10" />
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Listez votre entreprise
          </h1>
          <p className="text-muted-foreground mb-8">
            Remplissez les détails pour mettre votre entreprise en vente
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-2xl shadow-elegant border border-border/50">
            <div>
              <Label htmlFor="title">Titre de l'annonce *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Ex: Restaurant italien bien établi à Montréal"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={6}
                placeholder="Décrivez votre entreprise en détail..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="industry">Industrie *</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Restaurant">Restaurant</SelectItem>
                    <SelectItem value="Commerce de détail">Commerce de détail</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Technologie">Technologie</SelectItem>
                    <SelectItem value="Fabrication">Fabrication</SelectItem>
                    <SelectItem value="Immobilier">Immobilier</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Localisation *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  placeholder="Ex: Montréal, QC"
                />
              </div>

              <div>
                <Label htmlFor="asking_price">Prix demandé (€) *</Label>
                <Input
                  id="asking_price"
                  type="number"
                  value={formData.asking_price}
                  onChange={(e) => setFormData({ ...formData, asking_price: e.target.value })}
                  required
                  placeholder="250000"
                />
              </div>

              <div>
                <Label htmlFor="annual_revenue">Revenu annuel (€)</Label>
                <Input
                  id="annual_revenue"
                  type="number"
                  value={formData.annual_revenue}
                  onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value })}
                  placeholder="500000"
                />
              </div>

              <div>
                <Label htmlFor="profit_margin">Marge de profit (%)</Label>
                <Input
                  id="profit_margin"
                  type="number"
                  step="0.01"
                  value={formData.profit_margin}
                  onChange={(e) => setFormData({ ...formData, profit_margin: e.target.value })}
                  placeholder="25"
                />
              </div>

              <div>
                <Label htmlFor="employees_count">Nombre d'employés</Label>
                <Input
                  id="employees_count"
                  type="number"
                  value={formData.employees_count}
                  onChange={(e) => setFormData({ ...formData, employees_count: e.target.value })}
                  placeholder="10"
                />
              </div>

              <div>
                <Label htmlFor="year_established">Année de fondation</Label>
                <Input
                  id="year_established"
                  type="number"
                  value={formData.year_established}
                  onChange={(e) => setFormData({ ...formData, year_established: e.target.value })}
                  placeholder="2010"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Publication..." : "Publier l'annonce"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")} disabled={loading}>
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ListBusiness;
