import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { ChatBox } from "@/components/ChatBox";

interface Conversation {
  business_id: string;
  business_title: string;
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

          conversationsMap.set(key, {
            business_id: msg.business_id,
            business_title: (msg.businesses as any).title,
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
    <div className="space-y-4">
      {conversations.map((conv) => (
        <Card
          key={`${conv.business_id}-${conv.other_user_id}`}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setSelectedConversation(conv)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{conv.business_title}</CardTitle>
              {conv.unread_count > 0 && (
                <Badge variant="default" className="bg-accent">
                  {conv.unread_count} nouveau{conv.unread_count > 1 ? 'x' : ''}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {conv.last_message}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(conv.last_message_time).toLocaleDateString('fr-CA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
