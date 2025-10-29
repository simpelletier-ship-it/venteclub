import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import BusinessCard from "@/components/BusinessCard";
import { useToast } from "@/hooks/use-toast";

interface PurchasedBusinessesProps {
  userId: string;
}

export const PurchasedBusinesses = ({ userId }: PurchasedBusinessesProps) => {
  const [purchasedBusinesses, setPurchasedBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchasedBusinesses();
  }, [userId]);

  const fetchPurchasedBusinesses = async () => {
    try {
      console.log('Fetching purchased businesses for user:', userId);
      
      // Get all businesses the user has access to
      const { data: accessRecords, error: accessError } = await supabase
        .from('contact_access')
        .select(`
          *,
          businesses!inner (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      console.log('Access records fetched:', accessRecords);

      if (accessError) {
        console.error('Access error:', accessError);
        throw accessError;
      }

      // Extract businesses from the records
      const businesses = accessRecords?.map(record => ({
        ...record.businesses,
        purchase_date: record.created_at,
      })) || [];

      console.log('Businesses to display:', businesses);
      setPurchasedBusinesses(businesses);
    } catch (error: any) {
      console.error('Error fetching purchased businesses:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger vos achats",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Chargement de vos achats...</p>
      </div>
    );
  }

  if (purchasedBusinesses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Vous n'avez pas encore débloqué de vendeurs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mes Accès</h2>
          <p className="text-muted-foreground mt-1">
            Vendeurs dont vous avez débloqué les coordonnées
          </p>
        </div>
      </div>

      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
        <p className="text-sm font-medium">
          💡 Cliquez sur une annonce pour accéder aux coordonnées du vendeur et démarrer une conversation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {purchasedBusinesses.map((business) => (
          <div key={business.id} className="relative">
            <BusinessCard {...business} />
            <div className="mt-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
              <span>✓ Accès débloqué le {new Date(business.purchase_date).toLocaleDateString('fr-CA')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
