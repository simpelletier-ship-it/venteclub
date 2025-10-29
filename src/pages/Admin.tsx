import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye, ArrowLeft } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: hasAdminRole } = await supabase
        .rpc('has_role', { 
          _user_id: session.user.id, 
          _role: 'admin' 
        });

      if (!hasAdminRole) {
        toast({
          variant: "destructive",
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions d'administrateur.",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchBusinesses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
      navigate("/");
    }
  };

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

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

  const updateBusinessStatus = async (businessId: string, approvalStatus: string) => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ approval_status: approvalStatus })
        .eq('id', businessId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `L'annonce a été ${approvalStatus === 'approved' ? 'approuvée' : 'rejetée'}.`,
      });

      fetchBusinesses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    
    const labels: Record<string, string> = {
      pending: "En attente",
      approved: "Approuvée",
      rejected: "Rejetée",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
            <span className="text-2xl font-bold">
              Vente<span className="text-accent">.Club</span>
            </span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Tableau de bord Admin
          </h1>
          <p className="text-muted-foreground">
            Gérez les annonces d'entreprises
          </p>
        </div>

        <div className="grid gap-6">
          {businesses.map((business) => (
            <Card key={business.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{business.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {business.location} • {business.industry}
                    </CardDescription>
                  </div>
                  {getStatusBadge(business.approval_status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {business.description}
                </p>
                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-semibold">Prix demandé:</span> {business.asking_price?.toLocaleString()} $ CAD
                  </div>
                  {business.annual_revenue && (
                    <div>
                      <span className="font-semibold">Revenus:</span> {business.annual_revenue?.toLocaleString()} $ CAD
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/business/${business.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Voir
                  </Button>
                  {business.approval_status !== 'approved' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => updateBusinessStatus(business.id, 'approved')}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approuver
                    </Button>
                  )}
                  {business.approval_status !== 'rejected' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => updateBusinessStatus(business.id, 'rejected')}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;
