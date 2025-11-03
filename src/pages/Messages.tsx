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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-3 text-sm hover:bg-muted/50 transition-colors group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Retour au tableau de bord
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 shadow-sm">
              <MessageSquare className="h-6 sm:h-7 w-6 sm:w-7 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground">
              Messagerie
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground font-medium">
            Gérez vos conversations professionnelles en temps réel
          </p>
        </div>

        {conversations.length === 0 ? (
          <Card className="border-border/60 shadow-xl">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mx-auto mb-5 shadow-lg">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <p className="text-lg font-bold text-foreground mb-2">
                Aucune conversation
              </p>
              <p className="text-sm text-muted-foreground">
                Vos conversations apparaîtront ici
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Liste des conversations Professional */}
            <Card className="lg:col-span-1 border-border/60 shadow-xl overflow-hidden">
              <CardContent className="p-4 sm:p-5 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-lg flex items-center gap-2.5 text-foreground">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 shadow-sm">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    Conversations
                  </h2>
                  <Badge variant="secondary" className="font-semibold">
                    {conversations.length}
                  </Badge>
                </div>
                <ScrollArea className="h-[400px] sm:h-[500px] lg:h-[600px] pr-3">
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <div
                        key={`${conv.business_id}-${conv.other_user_id}`}
                        className={`group p-3.5 sm:p-4 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                          selectedConversation?.business_id === conv.business_id &&
                          selectedConversation?.other_user_id === conv.other_user_id
                            ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/60 shadow-lg shadow-primary/10'
                            : 'bg-card/80 backdrop-blur-sm border border-border/60 hover:bg-card hover:border-primary/40 hover:shadow-md'
                        }`}
                        onClick={() => handleConversationClick(conv)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                                {conv.business_title}
                              </h3>
                              {conv.unread_count > 0 && (
                                <Badge className="h-5 min-w-5 px-2 text-xs flex-shrink-0 bg-gradient-to-r from-primary to-primary/90 shadow-md animate-pulse">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <span className="text-base">{conv.is_seller ? '🛒' : '🔑'}</span>
                                <span className="truncate">{conv.other_user_name}</span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground/90 truncate leading-relaxed">
                              {conv.last_message}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-3 flex-shrink-0">
                            <span className="text-[10px] font-semibold text-muted-foreground/70 whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-full">
                              {new Date(conv.last_message_time).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                            {conv.unread_count > 0 && (
                              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/90 shadow-lg animate-pulse" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Zone de chat Professional */}
            <Card className="lg:col-span-2 border-border/60 shadow-xl overflow-hidden">
              <CardContent className="p-0 h-[500px] sm:h-[600px] lg:h-[690px] flex flex-col bg-card/30 backdrop-blur-sm">
                {selectedConversation ? (
                  <ChatBox
                    businessId={selectedConversation.business_id}
                    currentUserId={user?.id}
                    otherUserId={selectedConversation.other_user_id}
                    otherUserName={selectedConversation.other_user_name}
                    businessTitle={selectedConversation.business_title}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-background via-muted/10 to-background">
                    <div className="text-center px-6 animate-fade-in">
                      <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10 flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <MessageSquare className="h-14 w-14 text-primary animate-pulse" />
                      </div>
                      <p className="text-xl font-bold text-foreground mb-3">
                        Sélectionnez une conversation
                      </p>
                      <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                        Choisissez une conversation dans la liste pour commencer à échanger en temps réel
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
