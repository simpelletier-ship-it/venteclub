import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Paperclip, X, Download, FileText, Image as ImageIcon, ExternalLink, Mail, Phone, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { QuickMessageTemplates } from "@/components/QuickMessageTemplates";
import { ProfileCompletionAlert } from "@/components/ProfileCompletionAlert";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  read_at?: string;
}

interface MessageAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface ChatBoxProps {
  businessId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserName?: string;
  businessTitle?: string;
}

export const ChatBox = ({ businessId, currentUserId, otherUserId, otherUserName, businessTitle }: ChatBoxProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageAttachments, setMessageAttachments] = useState<Record<string, MessageAttachment[]>>({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const [sellerContact, setSellerContact] = useState<any>(null);
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [isSeller, setIsSeller] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
    fetchOtherUserProfile();
    fetchSellerContact();
    fetchBusinessSlug();
    fetchCurrentUserProfile();
    
    // Subscribe to realtime messages
    const channel = supabase
      .channel(`chat:${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;
            setMessages(prev => [...prev, newMsg]);
            
            // Mark as read if current user is receiver
            if (newMsg.receiver_id === currentUserId) {
              markAsRead(newMsg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, currentUserId, otherUserId]);

  const fetchBusinessSlug = async () => {
    const { data } = await supabase
      .from('businesses')
      .select('slug, seller_id')
      .eq('id', businessId)
      .maybeSingle();
    
    if (data?.slug) {
      setBusinessSlug(data.slug);
    }
    if (data?.seller_id) {
      setIsSeller(data.seller_id === currentUserId);
    }
  };

  const fetchCurrentUserProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .single();
    
    if (data) {
      setCurrentUserProfile(data);
    }
  };

  const fetchOtherUserProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', otherUserId)
      .single();
    
    if (data) {
      setOtherUserProfile(data);
    }
  };

  const fetchSellerContact = async () => {
    // Check if current user has access to seller contact
    const { data: business } = await supabase
      .from('businesses')
      .select('seller_id')
      .eq('id', businessId)
      .single();

    if (!business) return;

    // Check if user has access (is seller or has purchased access)
    const hasAccess = business.seller_id === currentUserId || 
      (await supabase
        .from('contact_access')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('business_id', businessId)
        .single()).data;

    if (hasAccess) {
      const { data } = await supabase
        .from('seller_contacts')
        .select('*')
        .eq('seller_id', otherUserId)
        .single();
      
      if (data) {
        setSellerContact(data);
      }
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('business_id', businessId)
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);

    // Fetch attachments for all messages
    if (data && data.length > 0) {
      const messageIds = data.map(m => m.id);
      const { data: attachmentsData } = await supabase
        .from('message_attachments')
        .select('*')
        .in('message_id', messageIds);

      if (attachmentsData) {
        const attachmentsByMessage: Record<string, MessageAttachment[]> = {};
        attachmentsData.forEach((att: any) => {
          if (!attachmentsByMessage[att.message_id]) {
            attachmentsByMessage[att.message_id] = [];
          }
          attachmentsByMessage[att.message_id].push(att);
        });
        setMessageAttachments(attachmentsByMessage);
      }
    }

    // Mark unread messages as read
    const unreadMessages = data?.filter(
      msg => msg.receiver_id === currentUserId && !msg.read
    );
    
    if (unreadMessages && unreadMessages.length > 0) {
      unreadMessages.forEach(msg => markAsRead(msg.id));
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', messageId);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      toast({
        variant: "destructive",
        title: "Limite dépassée",
        description: "Vous pouvez envoyer un maximum de 5 fichiers à la fois.",
      });
      return;
    }

    // Check file sizes (max 10MB per file)
    const invalidFiles = files.filter(f => f.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Fichier trop volumineux",
        description: "Les fichiers ne doivent pas dépasser 10 Mo.",
      });
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    setLoading(true);
    try {
      const filesToUpload = [...selectedFiles];

      // Check if this is the first message from this user for this business
      const { data: existingMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('business_id', businessId)
        .eq('sender_id', currentUserId)
        .limit(1);

      const isFirstMessage = !existingMessages || existingMessages.length === 0;

      const messageContent = newMessage.trim() || (filesToUpload.length > 0 ? "[Fichier joint]" : "");

      const { data: messageData, error } = await supabase
        .from('messages')
        .insert({
          business_id: businessId,
          sender_id: currentUserId,
          receiver_id: otherUserId,
          content: messageContent,
        })
        .select()
        .single();

      if (error) throw error;

      // Track lead analytics if this is the first message - with error handling
      if (isFirstMessage) {
        try {
          await supabase
            .from('business_analytics')
            .insert({
              business_id: businessId,
              event_type: 'lead',
              user_id: currentUserId,
            });
        } catch (analyticsError) {
          // Silently fail if rate limited
          console.log('Analytics tracking skipped:', analyticsError);
        }
      }

      // Upload files including contact card if generated
      if (filesToUpload.length > 0) {
        setUploading(true);
        try {
          for (const file of filesToUpload) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentUserId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from('message-attachments')
              .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('message-attachments')
              .getPublicUrl(fileName);

            await supabase.from('message_attachments').insert({
              message_id: messageData.id,
              file_name: file.name,
              file_url: publicUrl,
              file_type: file.type,
              file_size: file.size,
            });
          }
        } finally {
          setUploading(false);
        }
      }

      setNewMessage("");
      setSelectedFiles([]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le message",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      sendMessage();
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return <User className="h-5 w-5" />;
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-muted/10 to-background">
      {/* Header Professional */}
      <div className="bg-card/50 backdrop-blur-xl p-4 sm:p-5 border-b border-border/60 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative group">
            <Avatar className="h-11 sm:h-12 w-11 sm:w-12 ring-2 ring-primary/30 shadow-md transition-all group-hover:ring-primary/50">
              <AvatarImage src={otherUserProfile?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-primary font-bold text-base sm:text-lg">
                {getInitials(otherUserProfile?.full_name || otherUserName)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 sm:w-4 h-3.5 sm:h-4 bg-emerald-500 rounded-full border-2 border-card shadow-sm animate-pulse" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base sm:text-lg text-foreground mb-0.5 truncate leading-tight">
              {otherUserProfile?.full_name || otherUserName || "Utilisateur"}
            </h3>
            
            {businessTitle && businessSlug && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary mb-1 transition-colors"
                onClick={() => navigate(`/entreprise/${businessSlug}`)}
              >
                <ExternalLink className="mr-1.5 h-3 sm:h-3.5 w-3 sm:w-3.5" />
                <span className="truncate">{businessTitle}</span>
              </Button>
            )}

            {sellerContact && (
              <div className="flex flex-wrap gap-3 sm:gap-4 mt-1.5 text-xs sm:text-sm">
                {sellerContact.email && (
                  <div className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-3.5 sm:h-4 w-3.5 sm:w-4 flex-shrink-0" />
                    <a href={`mailto:${sellerContact.email}`} className="truncate max-w-[180px]">
                      {sellerContact.email}
                    </a>
                  </div>
                )}
                {sellerContact.phone && (
                  <div className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="h-3.5 sm:h-4 w-3.5 sm:w-4 flex-shrink-0" />
                    <a href={`tel:${sellerContact.phone}`}>
                      {sellerContact.phone}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area Professional */}
      <ScrollArea className="flex-1 p-4 sm:p-6" ref={scrollRef}>
        <div className="space-y-4 sm:space-y-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-5 shadow-lg">
                <Send className="w-12 h-12 text-primary" />
              </div>
              <p className="text-foreground text-xl font-bold mb-2">
                Aucun message pour le moment
              </p>
              <p className="text-muted-foreground text-sm">
                Commencez la conversation dès maintenant
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isCurrentUser = message.sender_id === currentUserId;
              const attachments = messageAttachments[message.id] || [];
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showDate = !prevMessage || 
                new Date(message.created_at).toDateString() !== new Date(prevMessage.created_at).toDateString();
              
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-6">
                      <div className="bg-muted/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-semibold text-muted-foreground shadow-sm">
                        {new Date(message.created_at).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div
                    className={`flex items-end gap-2.5 sm:gap-3 animate-fade-in ${
                      isCurrentUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isCurrentUser && (
                      <Avatar className="h-8 sm:h-9 w-8 sm:w-9 mb-0.5 ring-2 ring-border shadow-md flex-shrink-0">
                        <AvatarImage src={otherUserProfile?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/15 to-secondary/15 text-primary font-semibold text-xs">
                          {getInitials(otherUserProfile?.full_name || otherUserName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-md backdrop-blur-sm transition-all hover:shadow-lg ${
                          isCurrentUser
                            ? 'bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground rounded-br-md'
                            : 'bg-card/95 border border-border/60 text-foreground rounded-bl-md'
                        }`}
                      >
                        {message.content !== "[Fichier joint]" && (
                          <p className={`text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
                            isCurrentUser ? 'text-primary-foreground' : 'text-foreground'
                          }`}>
                            {message.content}
                          </p>
                        )}
                        
                        {attachments.length > 0 && (
                          <div className="mt-2.5 space-y-2">
                            {attachments.map((att) => {
                              const isImage = att.file_type.startsWith('image/');
                              return (
                                <div
                                  key={att.id}
                                  className={`${
                                    isCurrentUser ? 'bg-primary-foreground/15' : 'bg-muted/70'
                                  } rounded-xl p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3 backdrop-blur-sm hover:bg-opacity-80 transition-colors`}
                                >
                                  {isImage ? (
                                    <ImageIcon className="w-4 h-4 shrink-0" />
                                  ) : (
                                    <FileText className="w-4 h-4 shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{att.file_name}</p>
                                    <p className="text-xs opacity-70">{formatFileSize(att.file_size)}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => downloadFile(att.file_url, att.file_name)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] sm:text-xs ${isCurrentUser ? 'text-primary-foreground/60' : 'text-muted-foreground/80'}`}>
                          {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isCurrentUser && message.read && (
                          <span className="text-[10px]">✓✓</span>
                        )}
                      </div>
                    </div>
                    
                    {isCurrentUser && (
                      <Avatar className="h-8 sm:h-9 w-8 sm:w-9 mb-0.5 ring-2 ring-border shadow-md flex-shrink-0">
                        <AvatarImage src={currentUserProfile?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/15 to-secondary/15 text-primary font-semibold text-xs">
                          {getInitials(currentUserProfile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input Area - Style moderne */}
      <div className="p-3 sm:p-6 border-t border-border/50 bg-gradient-to-r from-background via-muted/5 to-background backdrop-blur-sm space-y-3 sm:space-y-4">
        {/* Profile completion alert - Only for buyers */}
        {!isSeller && <ProfileCompletionAlert profile={currentUserProfile} />}
        
        {/* Quick message templates - Show only for buyers who haven't sent messages yet */}
        {!isSeller && messages.filter(m => m.sender_id === currentUserId).length === 0 && (
          <QuickMessageTemplates onSelectTemplate={(template) => setNewMessage(template)} />
        )}
        
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 sm:gap-3 bg-card border border-border/50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-xs sm:text-sm shadow-sm"
              >
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="w-3 sm:w-4 h-3 sm:h-4 shrink-0 text-muted-foreground" />
                ) : (
                  <FileText className="w-3 sm:w-4 h-3 sm:h-4 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 truncate text-xs sm:text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(index)}
                  className="h-5 sm:h-6 w-5 sm:w-6 p-0"
                >
                  <X className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex gap-2 sm:gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploading}
              className="h-10 sm:h-12 w-10 sm:w-12 shrink-0 rounded-lg sm:rounded-xl hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
            >
              <Paperclip className="h-4 sm:h-5 w-4 sm:w-5" />
            </Button>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Écrivez votre message..."
              className="min-h-[44px] sm:min-h-[56px] max-h-[100px] sm:max-h-[120px] resize-none rounded-lg sm:rounded-xl border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-sm sm:text-base"
              disabled={loading || uploading}
            />
            <Button
              type="button"
              onClick={() => sendMessage()}
              disabled={loading || uploading || (!newMessage.trim() && selectedFiles.length === 0)}
              size="icon"
              className="h-10 sm:h-12 w-10 sm:w-12 shrink-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Send className="h-4 sm:h-5 w-4 sm:w-5" />
            </Button>
          </div>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-2 sm:mt-3 flex items-center gap-1 flex-wrap">
          <span>Appuyez sur Entrée pour envoyer</span>
          <span className="text-muted-foreground/50">•</span>
          <span>Max 5 fichiers (10 Mo chacun)</span>
        </p>
      </div>
    </div>
  );
};
