import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatBox } from "./ChatBox";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Users } from "lucide-react";

interface Buyer {
  user_id: string;
  user_email: string;
  user_name: string | null;
  purchased_at: string;
  access_type: string;
  unread_count: number;
}

interface SellerChatSectionProps {
  businessId: string;
  sellerId: string;
}

export const SellerChatSection = ({ businessId, sellerId }: SellerChatSectionProps) => {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBuyers();

    // Subscribe to new contact access
    const channel = supabase
      .channel(`seller-buyers:${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_access',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          fetchBuyers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  const fetchBuyers = async () => {
    try {
      // Get all users who purchased access
      const { data: accessRecords } = await supabase
        .from('contact_access')
        .select(`
          user_id,
          created_at,
          access_type
        `)
        .eq('business_id', businessId);

      if (!accessRecords || accessRecords.length === 0) {
        setLoading(false);
        return;
      }

      // Get user profiles and unread message counts
      const buyersData = await Promise.all(
        accessRecords.map(async (record) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', record.user_id)
            .single();

          // Count unread messages from this buyer
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('sender_id', record.user_id)
            .eq('receiver_id', sellerId)
            .eq('read', false);

          return {
            user_id: record.user_id,
            user_email: profile?.email || 'Email non disponible',
            user_name: profile?.full_name,
            purchased_at: record.created_at,
            access_type: record.access_type,
            unread_count: count || 0
          };
        })
      );

      setBuyers(buyersData);
      
      // Auto-select first buyer if none selected
      if (!selectedBuyerId && buyersData.length > 0) {
        setSelectedBuyerId(buyersData[0].user_id);
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border-t pt-6 mt-6">
        <div className="text-center py-8 text-muted-foreground">
          Chargement des conversations...
        </div>
      </div>
    );
  }

  if (buyers.length === 0) {
    return (
      <div className="border-t pt-6 mt-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Conversations avec les acheteurs
        </h2>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucun acheteur n'a encore acheté l'accès à vos coordonnées pour cette annonce.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedBuyer = buyers.find(b => b.user_id === selectedBuyerId);

  return (
    <div className="border-t pt-6 mt-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Conversations avec les acheteurs
      </h2>

      <div className="grid md:grid-cols-3 gap-4">
        {/* List of buyers */}
        <div className="md:col-span-1 space-y-2">
          <p className="text-sm text-muted-foreground mb-2">
            {buyers.length} acheteur{buyers.length > 1 ? 's' : ''} intéressé{buyers.length > 1 ? 's' : ''}
          </p>
          {buyers.map((buyer) => (
            <Card
              key={buyer.user_id}
              className={`cursor-pointer transition-all ${
                selectedBuyerId === buyer.user_id
                  ? 'border-accent border-2 shadow-md'
                  : 'hover:border-accent/50'
              }`}
              onClick={() => setSelectedBuyerId(buyer.user_id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {buyer.user_name || buyer.user_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {buyer.access_type === 'one_time' ? 'Accès unique' : 'Abonnement'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(buyer.purchased_at).toLocaleDateString('fr-CA')}
                    </p>
                  </div>
                  {buyer.unread_count > 0 && (
                    <Badge variant="default" className="bg-accent ml-2">
                      {buyer.unread_count}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chat with selected buyer */}
        <div className="md:col-span-2">
          {selectedBuyer && (
            <ChatBox
              businessId={businessId}
              currentUserId={sellerId}
              otherUserId={selectedBuyer.user_id}
              otherUserName={selectedBuyer.user_name || selectedBuyer.user_email}
            />
          )}
        </div>
      </div>
    </div>
  );
};
