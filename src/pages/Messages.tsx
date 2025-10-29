import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Circle, ArrowLeft } from "lucide-react";
import { ChatBox } from "@/components/ChatBox";
import { Button } from "@/components/ui/button";

interface Conversation {
  business_id: string;
  business_title: string;
  other_user_id: string;
  other_user_email: string;
  other_user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_seller: boolean;
}

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await fetchConversations(session.user.id);
      
      // Check if we have a conversation param to open
      const conversationParam = searchParams.get('conversation');
      if (conversationParam) {
        const [businessId, otherUserId] = conversationParam.split('-');
        // Find and select this conversation
        const conv = conversations.find(c => 
          c.business_id === businessId && c.other_user_id === otherUserId
        );
        if (conv) {
          setSelectedConversation(conv);
        }
      }
    };

    initialize();
  }, [navigate, searchParams]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const channel = supabase
      .channel('messages-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchConversations = async (userId: string) => {
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
            .maybeSingle();

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
            other_user_name: otherUserData?.full_name || otherUserData?.email || 'Utilisateur',
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: unreadCount || 0,
            is_seller: isSeller,
          });
        }
      }

      const convList = Array.from(conversationsMap.values());
      setConversations(convList);
      
      // Auto-select first conversation if none selected
      if (!selectedConversation && convList.length > 0) {
        setSelectedConversation(convList[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Messagerie
          </h1>
          <p className="text-muted-foreground">
            Gérez vos conversations avec les acheteurs et vendeurs
          </p>
        </div>

        {conversations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucune conversation pour le moment
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liste des conversations */}
            <Card className="lg:col-span-1">
              <CardContent className="p-4">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversations
                </h2>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <div
                        key={`${conv.business_id}-${conv.other_user_id}`}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation?.business_id === conv.business_id &&
                          selectedConversation?.other_user_id === conv.other_user_id
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-accent/20 hover:bg-accent/50 border-2 border-transparent'
                        }`}
                        onClick={() => handleConversationClick(conv)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm truncate">{conv.business_title}</h3>
                              {conv.unread_count > 0 && (
                                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs flex-shrink-0">
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
                          <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
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
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Zone de chat */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                {selectedConversation ? (
                  <div>
                    <div className="mb-4 pb-4 border-b">
                      <h2 className="text-xl font-bold">{selectedConversation.business_title}</h2>
                      <p className="text-sm text-muted-foreground">
                        Conversation avec {selectedConversation.other_user_name}
                      </p>
                    </div>
                    <ChatBox
                      businessId={selectedConversation.business_id}
                      currentUserId={user?.id}
                      otherUserId={selectedConversation.other_user_id}
                      otherUserName={selectedConversation.other_user_name}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[600px]">
                    <div className="text-center">
                      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Sélectionnez une conversation pour commencer
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
