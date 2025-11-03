import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageSquare, ChevronRight, Search, Trash2, SortDesc, User, CheckCheck, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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

interface ConversationsListProps {
  userId: string;
}

export const ConversationsList = ({ userId }: ConversationsListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>('recent');
  const navigate = useNavigate();
  const { toast } = useToast();

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
            .select('email, full_name, avatar_url')
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
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .or(`sender_id.eq.${conversation.other_user_id},receiver_id.eq.${conversation.other_user_id}`);

      if (error) throw error;

      toast({
        title: "Conversation supprimée",
        description: "La conversation a été supprimée avec succès.",
      });

      fetchConversations();
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
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortType === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortType('recent')}
          >
            <SortDesc className="h-4 w-4 mr-1" />
            Récents
          </Button>
          <Button
            variant={sortType === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortType('unread')}
          >
            Non lus
          </Button>
          <Button
            variant={sortType === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortType('name')}
          >
            Nom
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {filteredConversations.map((conv) => (
          <Card
            key={`${conv.business_id}-${conv.other_user_id}`}
            className="group cursor-pointer hover:bg-card/80 hover:border-primary/40 hover:shadow-lg transition-all duration-300 border-border/60 backdrop-blur-sm"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {/* Avatar de la personne à gauche */}
                <div 
                  className="relative flex-shrink-0"
                  onClick={() => handleConversationClick(conv)}
                >
                  <Avatar className="h-14 w-14 ring-2 ring-border/40">
                    <AvatarImage src={conv.other_user_avatar || undefined} alt={conv.other_user_name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground font-semibold">
                      {getInitials(conv.other_user_name)}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary/90 shadow-lg animate-pulse">
                      <span className="text-[10px] font-bold text-primary-foreground">{conv.unread_count}</span>
                    </div>
                  )}
                </div>

                        {/* Contenu au milieu */}
                        <div 
                          className="flex-1 min-w-0"
                          onClick={() => handleConversationClick(conv)}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <h3 className="font-bold text-sm truncate leading-tight">
                                {conv.other_user_name}
                              </h3>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/profile/${conv.other_user_id}`);
                                }}
                              >
                                <User className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground/70 whitespace-nowrap ml-2">
                              {new Date(conv.last_message_time).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-muted-foreground/60 truncate mb-1.5">
                            {conv.business_title}
                          </p>
                          
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-foreground/70 truncate leading-tight flex-1">
                              {conv.last_message}
                            </p>
                            {conv.last_message_sender_id === userId && (
                              conv.last_message_read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                              )
                            )}
                            <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
                          </div>
                        </div>

                {/* Image annonce à droite */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div 
                    className="w-12 h-12 rounded-lg overflow-hidden bg-muted shadow-sm ring-1 ring-border/40"
                    onClick={() => handleConversationClick(conv)}
                  >
                    {conv.business_photo ? (
                      <img 
                        src={conv.business_photo} 
                        alt={conv.business_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <span className="text-lg">🏢</span>
                      </div>
                    )}
                  </div>

                  {/* Bouton supprimer */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la conversation</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer cette conversation avec {conv.other_user_name} ? Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteConversation(conv)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
