import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageSquare, ArrowLeft, Search, Trash2, CheckCheck, Check } from "lucide-react";
import { ChatBox } from "@/components/ChatBox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSound } from "@/hooks/useNotificationSound";

interface Conversation {
  business_id: string;
  business_title: string;
  business_photo: string | null;
  other_user_id: string;
  other_user_email: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message: string;
  last_message_time: string;
  last_message_sender_id: string;
  last_message_read: boolean;
  unread_count: number;
  is_seller: boolean;
}

type SortType = 'recent' | 'unread' | 'name';

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>('recent');
  const { toast } = useToast();
  const { playNotificationSound } = useNotificationSound();
  const previousMessageCountRef = useRef<number>(0);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await fetchConversations(session.user.id);
    };

    initialize();
  }, [navigate]);

  // Separate effect to handle conversation selection after conversations are loaded
  useEffect(() => {
    const handleConversationParam = async () => {
      const conversationParam = searchParams.get('conversation');
      if (!conversationParam || !user) return;
      
      const [businessId, otherUserId] = conversationParam.split('-');
      
      // Try to find existing conversation
      if (conversations.length > 0) {
        const conv = conversations.find(c => 
          c.business_id === businessId && c.other_user_id === otherUserId
        );
        if (conv) {
          setSelectedConversation(conv);
          return;
        }
      }
      
      // No conversation found, but user might have unlocked the chat
      // Create a virtual conversation to show the ChatBox
      const { data: accessData } = await supabase
        .from('contact_access')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', businessId)
        .limit(1);
      
      if (accessData && accessData.length > 0) {
        // User has access, fetch business and other user info
        const { data: businessData } = await supabase
          .from('businesses')
          .select('id, title, seller_id')
          .eq('id', businessId)
          .maybeSingle();
        
        if (!businessData) return;
        
        const { data: otherUserData } = await supabase
          .from('profiles')
          .select('email, full_name, avatar_url')
          .eq('id', otherUserId)
          .maybeSingle();
        
        const { data: photoData } = await supabase
          .from('business_photos')
          .select('photo_url')
          .eq('business_id', businessId)
          .order('display_order', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        // Create virtual conversation
        const virtualConv: Conversation = {
          business_id: businessId,
          business_title: businessData.title,
          business_photo: photoData?.photo_url || null,
          other_user_id: otherUserId,
          other_user_email: otherUserData?.email || 'Utilisateur',
          other_user_name: otherUserData?.full_name || otherUserData?.email || 'Utilisateur',
          other_user_avatar: otherUserData?.avatar_url || null,
          last_message: 'Démarrez la conversation...',
          last_message_time: new Date().toISOString(),
          last_message_sender_id: user.id,
          last_message_read: true,
          unread_count: 0,
          is_seller: businessData.seller_id === user.id,
        };
        
        setSelectedConversation(virtualConv);
      }
    };
    
    handleConversationParam();
  }, [conversations, searchParams, user]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const channel = supabase
      .channel('messages-list')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Jouer le son uniquement si le message n'est pas envoyé par l'utilisateur actuel
          if (payload.new && payload.new.sender_id !== user.id) {
            playNotificationSound();
          }
          fetchConversations(user.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
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
  }, [user, playNotificationSound]);

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
            .select('email, full_name, avatar_url')
            .eq('id', otherUserId)
            .maybeSingle();

          // Get business photo
          const { data: photoData } = await supabase
            .from('business_photos')
            .select('photo_url')
            .eq('business_id', msg.business_id)
            .order('display_order', { ascending: true })
            .limit(1)
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
            business_photo: photoData?.photo_url || null,
            other_user_id: otherUserId,
            other_user_email: otherUserData?.email || 'Utilisateur',
            other_user_name: otherUserData?.full_name || otherUserData?.email || 'Utilisateur',
            other_user_avatar: otherUserData?.avatar_url || null,
            last_message: msg.content,
            last_message_time: msg.created_at,
            last_message_sender_id: msg.sender_id,
            last_message_read: msg.read,
            unread_count: unreadCount || 0,
            is_seller: isSeller,
          });
        }
      }

      const convList = Array.from(conversationsMap.values());
      setConversations(convList);
      setFilteredConversations(convList);
      
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

  // Filter and sort conversations
  useEffect(() => {
    let filtered = conversations.filter(conv => 
      conv.business_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.last_message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'recent':
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        case 'unread':
          return b.unread_count - a.unread_count;
        case 'name':
          return a.other_user_name.localeCompare(b.other_user_name);
        default:
          return 0;
      }
    });

    setFilteredConversations(filtered);
  }, [conversations, searchQuery, sortType]);

  const handleDeleteConversation = async (conversation: Conversation) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('business_id', conversation.business_id)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .or(`sender_id.eq.${conversation.other_user_id},receiver_id.eq.${conversation.other_user_id}`);

      if (error) throw error;

      toast({
        title: "Conversation supprimée",
        description: "La conversation a été supprimée avec succès.",
      });

      fetchConversations(user?.id);
      
      // If the deleted conversation was selected, deselect it
      if (selectedConversation?.business_id === conversation.business_id && 
          selectedConversation?.other_user_id === conversation.other_user_id) {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la conversation.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header App-Style avec gradient et shadow */}
      <div className="flex-shrink-0 bg-gradient-to-r from-primary/95 via-primary to-primary/95 backdrop-blur-xl border-b border-primary/20 shadow-xl">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/10 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                {conversations.filter(c => c.unread_count > 0).length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">
                      {conversations.filter(c => c.unread_count > 0).length}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  Messagerie
                </h1>
                <p className="text-xs text-white/80">
                  {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarFallback className="bg-white/10 text-white font-semibold">
              {user?.email ? getInitials(user.email) : 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {conversations.length === 0 && !selectedConversation ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageSquare className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Aucune conversation
              </h2>
              <p className="text-muted-foreground">
                Vos conversations apparaîtront ici lorsque vous contacterez des vendeurs
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] overflow-hidden">
            {/* Liste conversations - Modern App Style */}
            {conversations.length > 0 && (
              <div className="hidden lg:flex flex-col border-r border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
                <div className="flex-shrink-0 p-4 border-b border-border/50 bg-card/50">
                  <h2 className="font-bold text-base text-foreground mb-3 flex items-center justify-between">
                    <span>Messages</span>
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {conversations.length}
                    </Badge>
                  </h2>
                  
                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 bg-background/50 border-border/50"
                    />
                  </div>
                  
                  {/* Filters */}
                  <div className="flex gap-1.5">
                    <Button
                      variant={sortType === 'recent' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSortType('recent')}
                      className="flex-1 h-8 text-xs"
                    >
                      Récents
                    </Button>
                    <Button
                      variant={sortType === 'unread' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSortType('unread')}
                      className="flex-1 h-8 text-xs"
                    >
                      Non lus
                    </Button>
                    <Button
                      variant={sortType === 'name' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSortType('name')}
                      className="flex-1 h-8 text-xs"
                    >
                      A-Z
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1 px-2">
                  <div className="space-y-1 py-2">
                    {filteredConversations.map((conv) => (
                      <div
                        key={`${conv.business_id}-${conv.other_user_id}`}
                        className={`group relative p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                          selectedConversation?.business_id === conv.business_id &&
                          selectedConversation?.other_user_id === conv.other_user_id
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-muted/50 border border-transparent'
                        }`}
                        onClick={() => handleConversationClick(conv)}
                      >
                        <div className="flex gap-3 items-start w-full">
                          {/* Avatar avec status */}
                          <div className="relative flex-shrink-0">
                            <Avatar className="h-12 w-12 border-2 border-background">
                              <AvatarImage src={conv.other_user_avatar || undefined} alt={conv.other_user_name} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground font-semibold text-xs">
                                {getInitials(conv.other_user_name)}
                              </AvatarFallback>
                            </Avatar>
                            {conv.unread_count > 0 && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                                <span className="text-[9px] font-bold text-white">
                                  {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2 mb-0.5">
                              <h3 className="font-semibold text-sm text-foreground truncate">
                                {conv.other_user_name}
                              </h3>
                              <span className="text-[10px] text-muted-foreground/70 flex-shrink-0">
                                {new Date(conv.last_message_time).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground/80 truncate mb-1">
                              {conv.business_title}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className={`text-xs line-clamp-1 flex-1 ${
                                conv.unread_count > 0 && conv.last_message_sender_id !== user?.id
                                  ? 'font-medium text-foreground' 
                                  : 'text-muted-foreground/70'
                              }`}>
                                {conv.last_message_sender_id === user?.id && (
                                  <>
                                    {conv.last_message_read ? (
                                      <CheckCheck className="h-3 w-3 text-primary inline mr-1" />
                                    ) : (
                                      <Check className="h-3 w-3 text-muted-foreground inline mr-1" />
                                    )}
                                  </>
                                )}
                                {conv.last_message}
                              </p>
                              {conv.is_seller && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 flex-shrink-0">
                                  Vendeur
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Delete button */}
                          <div className="flex-shrink-0">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive rounded-full"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer la conversation</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Voulez-vous vraiment supprimer cette conversation ? Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Annuler</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteConversation(conv);
                                    }}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Chat Area - Fullscreen Modern */}
            <div className="flex-1 flex flex-col bg-background overflow-hidden">
              {selectedConversation ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <ChatBox
                    businessId={selectedConversation.business_id}
                    currentUserId={user?.id}
                    otherUserId={selectedConversation.other_user_id}
                    otherUserName={selectedConversation.other_user_name}
                    businessTitle={selectedConversation.business_title}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 bg-muted/20">
                  <div className="text-center max-w-sm">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="h-12 w-12 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      Sélectionnez une conversation
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Choisissez une conversation dans la liste pour commencer à échanger
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
