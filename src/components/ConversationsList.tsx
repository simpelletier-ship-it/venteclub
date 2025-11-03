import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Conversation {
  business_id: string;
  business_title: string;
  business_photo: string | null;
  other_user_id: string;
  other_user_email: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_seller: boolean;
}

interface ConversationsListProps {
  userId: string;
}

export const ConversationsList = ({ userId }: ConversationsListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages-list')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      // Get all messages where user is involved
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          businesses!messages_business_id_fkey(id, title, seller_id)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by business and get latest message per conversation
      const conversationsMap = new Map<string, Conversation>();

      for (const msg of messages || []) {
        const business = msg.businesses;
        if (!business) continue;

        const isSeller = business.seller_id === userId;
        const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const key = `${msg.business_id}-${otherUserId}`;

        if (!conversationsMap.has(key)) {
          // Get other user info
          const { data: otherUserData } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', otherUserId)
            .single();

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', msg.business_id)
            .eq('sender_id', otherUserId)
            .eq('receiver_id', userId)
            .eq('read', false);

          // Get business photo
          const { data: photoData } = await supabase
            .from('business_photos')
            .select('photo_url')
            .eq('business_id', msg.business_id)
            .order('display_order', { ascending: true })
            .limit(1)
            .maybeSingle();

          conversationsMap.set(key, {
            business_id: msg.business_id,
            business_title: business.title,
            business_photo: photoData?.photo_url || null,
            other_user_id: otherUserId,
            other_user_email: otherUserData?.email || 'Utilisateur',
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: unreadCount || 0,
            is_seller: isSeller,
          });
        }
      }

      setConversations(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    navigate(`/messages?conversation=${conversation.business_id}-${conversation.other_user_id}`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Chargement des conversations...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Aucune conversation pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-3">
        {conversations.map((conv) => (
          <Card
            key={`${conv.business_id}-${conv.other_user_id}`}
            className="cursor-pointer hover:bg-card/80 hover:border-primary/40 hover:shadow-lg transition-all duration-300 border-border/60 backdrop-blur-sm"
            onClick={() => handleConversationClick(conv)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                {/* Image annonce */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shadow-md ring-2 ring-border/40">
                    {conv.business_photo ? (
                      <img 
                        src={conv.business_photo} 
                        alt={conv.business_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <span className="text-2xl">🏢</span>
                      </div>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary/90 shadow-lg animate-pulse">
                      <span className="text-[10px] font-bold text-primary-foreground">{conv.unread_count}</span>
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-sm truncate leading-tight">
                      {conv.business_title}
                    </h3>
                    <span className="text-[10px] font-semibold text-muted-foreground/70 whitespace-nowrap ml-2">
                      {new Date(conv.last_message_time).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-muted-foreground/60 mb-1.5 truncate">
                    {conv.is_seller ? '🔑 Acheteur' : '🛒 Vendeur'}: {conv.other_user_email}
                  </p>
                  
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-foreground/80 truncate leading-tight flex-1">
                      {conv.last_message}
                    </p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};
