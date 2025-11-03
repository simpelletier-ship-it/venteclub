import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft, ChevronRight } from "lucide-react";
import { ChatBox } from "@/components/ChatBox";

interface Conversation {
  business_id: string;
  business_title: string;
  business_photo: string | null;
  other_user_id: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface MessagesListProps {
  userId: string;
}

export const MessagesList = ({ userId }: MessagesListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    fetchConversations();

    // Subscribe to new messages
    const channel = supabase
      .channel('all-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
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
    try {
      // Get user's businesses
      const { data: userBusinesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('seller_id', userId);

      if (!userBusinesses || userBusinesses.length === 0) {
        setLoading(false);
        return;
      }

      const businessIds = userBusinesses.map(b => b.id);

      // Get all messages for user's businesses
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          *,
          businesses!inner(id, title)
        `)
        .in('business_id', businessIds)
        .order('created_at', { ascending: false });

      if (!messages) {
        setLoading(false);
        return;
      }

      // Group messages by business and conversation partner
      const conversationsMap = new Map<string, Conversation>();

      for (const msg of messages) {
        const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const key = `${msg.business_id}-${otherUserId}`;

        if (!conversationsMap.has(key)) {
          const unreadCount = messages.filter(
            m => m.business_id === msg.business_id &&
                 m.sender_id === otherUserId &&
                 m.receiver_id === userId &&
                 !m.read
          ).length;

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
            business_title: (msg.businesses as any).title,
            business_photo: photoData?.photo_url || null,
            other_user_id: otherUserId,
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: unreadCount,
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

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Aucune conversation pour le moment</p>
        </CardContent>
      </Card>
    );
  }

  // If a conversation is selected, show the chat
  if (selectedConversation) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedConversation(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux conversations
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{selectedConversation.business_title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChatBox
              businessId={selectedConversation.business_id}
              currentUserId={userId}
              otherUserId={selectedConversation.other_user_id}
              businessTitle={selectedConversation.business_title}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show conversation list
  return (
    <div className="space-y-3">
      {conversations.map((conv) => (
        <Card
          key={`${conv.business_id}-${conv.other_user_id}`}
          className={`cursor-pointer transition-all duration-300 border-border/60 hover:border-primary/40 hover:shadow-lg ${
            selectedConversation?.business_id === conv.business_id && 
            selectedConversation?.other_user_id === conv.other_user_id
              ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/60 shadow-lg'
              : 'bg-card/80 backdrop-blur-sm hover:bg-card'
          }`}
          onClick={() => setSelectedConversation(conv)}
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
  );
};
