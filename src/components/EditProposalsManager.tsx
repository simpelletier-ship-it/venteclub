import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const EditProposalsManager = () => {
  const { toast } = useToast();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from("business_edit_proposals")
        .select(`
          *,
          businesses (
            id,
            title,
            seller_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProposals(data || []);
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

  const handleViewProposal = (proposal: any) => {
    setSelectedProposal(proposal);
    setViewDialogOpen(true);
  };

  const handleApprove = async (proposalId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("business_edit_proposals")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", proposalId);

      if (error) throw error;

      toast({
        title: "Modification approuvée",
        description: "Les modifications ont été appliquées à l'annonce.",
      });

      fetchProposals();
      setViewDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleReject = async () => {
    if (!selectedProposal || !rejectionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez fournir une raison de rejet.",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("business_edit_proposals")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", selectedProposal.id);

      if (error) throw error;

      toast({
        title: "Modification rejetée",
        description: "L'utilisateur sera notifié du rejet.",
      });

      fetchProposals();
      setRejectDialogOpen(false);
      setViewDialogOpen(false);
      setRejectionReason("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-orange-500">⏳ En attente</Badge>;
      case "approved":
        return <Badge className="bg-green-500">✓ Approuvée</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">✗ Rejetée</Badge>;
      default:
        return null;
    }
  };

  const CompareField = ({ label, oldValue, newValue }: { label: string; oldValue: any; newValue: any }) => {
    if (newValue === undefined || newValue === null || newValue === oldValue) return null;
    
    return (
      <div className="py-2 border-b">
        <p className="text-sm font-semibold text-muted-foreground mb-1">{label}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Ancien</p>
            <p className="text-sm">{oldValue || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nouveau</p>
            <p className="text-sm font-semibold text-primary">{newValue}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  const pendingProposals = proposals.filter(p => p.status === "pending");
  const reviewedProposals = proposals.filter(p => p.status !== "pending");

  return (
    <div className="space-y-8">
      {/* Propositions en attente */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Propositions en attente ({pendingProposals.length})</h2>
        {pendingProposals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Aucune proposition en attente
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingProposals.map((proposal) => (
              <Card key={proposal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{proposal.businesses?.title}</CardTitle>
                      <CardDescription>
                        Soumis le {format(new Date(proposal.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </CardDescription>
                    </div>
                    {getStatusBadge(proposal.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProposal(proposal)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Voir les modifications
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApprove(proposal.id)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedProposal(proposal);
                        setRejectDialogOpen(true);
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Propositions traitées */}
      {reviewedProposals.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Propositions traitées</h2>
          <div className="grid gap-4">
            {reviewedProposals.map((proposal) => (
              <Card key={proposal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{proposal.businesses?.title}</CardTitle>
                      <CardDescription>
                        Traité le {format(new Date(proposal.reviewed_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </CardDescription>
                    </div>
                    {getStatusBadge(proposal.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {proposal.rejection_reason && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-3">
                      <p className="text-sm"><span className="font-semibold">Raison:</span> {proposal.rejection_reason}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewProposal(proposal)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Voir les modifications
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dialog pour voir les modifications */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifications proposées</DialogTitle>
            <DialogDescription>
              Comparez les anciennes et nouvelles valeurs
            </DialogDescription>
          </DialogHeader>
          {selectedProposal && (
            <div className="space-y-2">
              <CompareField
                label="Titre"
                oldValue={selectedProposal.businesses?.title}
                newValue={selectedProposal.proposed_changes?.title}
              />
              <CompareField
                label="Description"
                oldValue="[Voir l'annonce actuelle]"
                newValue={selectedProposal.proposed_changes?.description}
              />
              <CompareField
                label="Industrie"
                oldValue="[Actuel]"
                newValue={selectedProposal.proposed_changes?.industry}
              />
              <CompareField
                label="Localisation"
                oldValue="[Actuelle]"
                newValue={selectedProposal.proposed_changes?.location}
              />
              <CompareField
                label="Prix demandé"
                oldValue="[Actuel]"
                newValue={selectedProposal.proposed_changes?.asking_price ? 
                  `${selectedProposal.proposed_changes.asking_price.toLocaleString()} $ CAD` : null}
              />
              <CompareField
                label="Chiffre d'affaires"
                oldValue="[Actuel]"
                newValue={selectedProposal.proposed_changes?.annual_revenue ? 
                  `${selectedProposal.proposed_changes.annual_revenue.toLocaleString()} $ CAD` : null}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de rejet */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la proposition</DialogTitle>
            <DialogDescription>
              Expliquez pourquoi ces modifications sont rejetées
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection">Raison du rejet *</Label>
              <Textarea
                id="rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                placeholder="Ex: Le prix demandé est trop élevé pour le marché actuel..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
