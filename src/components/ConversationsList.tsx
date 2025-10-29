import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Conversation {
  business_id: string;
  business_title: string;
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

          conversationsMap.set(key, {
            business_id: msg.business_id,
            business_title: business.title,
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
    navigate(`/business/${conversation.business_id}`);
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
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => handleConversationClick(conv)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{conv.business_title}</h3>
                    {conv.unread_count > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {conv.is_seller ? '🔑 Acheteur' : '🛒 Vendeur'}: {conv.other_user_email}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.last_message}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(conv.last_message_time).toLocaleDateString('fr-CA', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  {conv.unread_count > 0 && (
                    <Circle className="w-2 h-2 fill-primary text-primary" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};
