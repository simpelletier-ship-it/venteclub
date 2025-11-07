import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatBox } from "./ChatBox";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getAvatarUrl } from "@/lib/avatarUtils";
import { Users, ChevronRight, User } from "lucide-react";

interface Buyer {
  user_id: string;
  user_email: string;
  user_name: string | null;
  avatar_url: string | null;
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
          created_at
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
            .select('email, full_name, avatar_url')
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
            avatar_url: profile?.avatar_url,
            purchased_at: record.created_at,
            access_type: 'token',
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
    return null;
  }

  const getInitials = (name?: string | null) => {
    if (!name) return <User className="h-5 w-5" />;
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const selectedBuyer = buyers.find(b => b.user_id === selectedBuyerId);

  return (
    <div className="border-t pt-6 mt-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
          <Users className="w-5 h-5 text-primary" />
        </div>
        Conversations avec les acheteurs
      </h2>

      <div className="grid md:grid-cols-3 gap-4">
        {/* List of buyers */}
        <div className="md:col-span-1 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-muted-foreground">
              {buyers.length} acheteur{buyers.length > 1 ? 's' : ''}
            </p>
            <Badge variant="secondary" className="font-semibold">
              {buyers.filter(b => b.unread_count > 0).length} non lu{buyers.filter(b => b.unread_count > 0).length > 1 ? 's' : ''}
            </Badge>
          </div>
          {buyers.map((buyer) => (
            <Card
              key={buyer.user_id}
              className={`cursor-pointer transition-all duration-300 border-border/60 ${
                selectedBuyerId === buyer.user_id
                  ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/60 shadow-lg'
                  : 'bg-card/80 backdrop-blur-sm hover:bg-card hover:border-primary/40 hover:shadow-md'
              }`}
              onClick={() => setSelectedBuyerId(buyer.user_id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12 ring-2 ring-border/40 shadow-md">
                      <AvatarImage src={getAvatarUrl(buyer.avatar_url, buyer.user_name, buyer.user_email)} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/15 to-secondary/15 text-primary font-semibold text-sm">
                        {getInitials(buyer.user_name)}
                      </AvatarFallback>
                    </Avatar>
                    {buyer.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary/90 shadow-lg animate-pulse">
                        <span className="text-[10px] font-bold text-primary-foreground">{buyer.unread_count}</span>
                      </div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-bold text-sm truncate leading-tight">
                        {buyer.user_name || buyer.user_email}
                      </p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 hover:text-primary transition-colors flex-shrink-0 ml-2" />
                    </div>
                    <p className="text-[11px] text-muted-foreground/70 mb-0.5">
                      Accès débloqué
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground/60">
                      {new Date(buyer.purchased_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
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
