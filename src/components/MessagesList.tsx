import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/avatarUtils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageSquare, ArrowLeft, ChevronRight, Search, Trash2, SortDesc, User, CheckCheck, Check } from "lucide-react";
import { ChatBox } from "@/components/ChatBox";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
}

type SortType = 'recent' | 'unread' | 'name';

interface MessagesListProps {
  userId: string;
}

export const MessagesList = ({ userId }: MessagesListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>('recent');
  const { toast } = useToast();
  const navigate = useNavigate();

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

          // Get other user info
          const { data: otherUserData } = await supabase
            .from('profiles')
            .select('email, full_name, avatar_url')
            .eq('id', otherUserId)
            .single();

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
            other_user_email: otherUserData?.email || '',
            other_user_name: otherUserData?.full_name || otherUserData?.email || 'Acheteur',
            other_user_avatar: otherUserData?.avatar_url || null,
            last_message: msg.content,
            last_message_time: msg.created_at,
            last_message_sender_id: msg.sender_id,
            last_message_read: msg.read,
            unread_count: unreadCount,
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

      <div className="space-y-3">
        {filteredConversations.map((conv) => (
          <Card
            key={`${conv.business_id}-${conv.other_user_id}`}
            className={`group transition-all duration-300 border-border/60 hover:border-primary/40 hover:shadow-lg ${
              selectedConversation?.business_id === conv.business_id && 
              selectedConversation?.other_user_id === conv.other_user_id
                ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/60 shadow-lg'
                : 'bg-card/80 backdrop-blur-sm hover:bg-card'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {/* Avatar de la personne à gauche */}
                <div 
                  className="relative flex-shrink-0 cursor-pointer"
                  onClick={() => setSelectedConversation(conv)}
                >
                  <Avatar className="h-14 w-14 ring-2 ring-border/40">
                    <AvatarImage src={getAvatarUrl(conv.other_user_avatar, conv.other_user_name, conv.other_user_email)} alt={conv.other_user_name} />
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
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setSelectedConversation(conv)}
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
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </div>

                {/* Image annonce à droite */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div 
                    className="w-12 h-12 rounded-lg overflow-hidden bg-muted shadow-sm ring-1 ring-border/40 cursor-pointer"
                    onClick={() => setSelectedConversation(conv)}
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
    </div>
  );
};
