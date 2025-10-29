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
      
      // Get all businesses the user has access to with seller contact info
      const { data: accessRecords, error: accessError } = await supabase
        .from('contact_access')
        .select(`
          *,
          businesses!inner (
            *,
            seller_contacts (email, phone)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      console.log('Access records fetched:', accessRecords);

      if (accessError) {
        console.error('Access error:', accessError);
        throw accessError;
      }

      // Extract businesses from the records with seller contact info
      const businesses = accessRecords?.map(record => ({
        ...record.businesses,
        purchase_date: record.created_at,
        seller_contact: Array.isArray(record.businesses.seller_contacts) && record.businesses.seller_contacts.length > 0
          ? record.businesses.seller_contacts[0]
          : null,
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
          <h2 className="text-2xl font-bold">Mes Accès Débloqués</h2>
          <p className="text-muted-foreground mt-1">
            Vendeurs dont vous avez débloqué les coordonnées ({purchasedBusinesses.length})
          </p>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <p className="text-sm font-medium text-green-900 dark:text-green-100">
          ✓ Vous avez accès aux coordonnées complètes de ces vendeurs. Cliquez sur une annonce pour voir les informations de contact et démarrer une conversation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {purchasedBusinesses.map((business) => (
          <div key={business.id} className="relative">
            <BusinessCard {...business} />
            <div className="mt-2 space-y-2">
              <div className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-2 rounded-md border border-green-200 dark:border-green-800">
                <span className="font-medium">✓ Accès débloqué le {new Date(business.purchase_date).toLocaleDateString('fr-CA', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</span>
              </div>
              {business.seller_contact && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📞 Coordonnées du vendeur
                  </p>
                  {business.seller_contact.email && (
                    <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
                      <span className="font-medium">Email:</span>{' '}
                      <a href={`mailto:${business.seller_contact.email}`} className="underline hover:no-underline">
                        {business.seller_contact.email}
                      </a>
                    </p>
                  )}
                  {business.seller_contact.phone && (
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      <span className="font-medium">Tél:</span>{' '}
                      <a href={`tel:${business.seller_contact.phone}`} className="underline hover:no-underline">
                        {business.seller_contact.phone}
                      </a>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
