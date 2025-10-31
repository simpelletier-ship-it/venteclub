import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Paperclip, X, Download, FileText, Image as ImageIcon, ExternalLink, Mail, Phone, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
    fetchOtherUserProfile();
    fetchSellerContact();
    fetchBusinessSlug();
    
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
      .select('slug')
      .eq('id', businessId)
      .maybeSingle();
    
    if (data?.slug) {
      setBusinessSlug(data.slug);
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
      .update({ read: true })
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

  const uploadFiles = async (messageId: string) => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of selectedFiles) {
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
          message_id: messageId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
        });
      }

      setSelectedFiles([]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer les fichiers",
      });
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    setLoading(true);
    try {
      // Check if this is the first message from this user for this business
      const { data: existingMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('business_id', businessId)
        .eq('sender_id', currentUserId)
        .limit(1);

      const isFirstMessage = !existingMessages || existingMessages.length === 0;

      const { data: messageData, error } = await supabase
        .from('messages')
        .insert({
          business_id: businessId,
          sender_id: currentUserId,
          receiver_id: otherUserId,
          content: newMessage.trim() || "[Fichier joint]",
        })
        .select()
        .single();

      if (error) throw error;

      // Track lead analytics if this is the first message
      if (isFirstMessage) {
        await supabase
          .from('business_analytics')
          .insert({
            business_id: businessId,
            event_type: 'lead',
            user_id: currentUserId,
          });
      }

      if (selectedFiles.length > 0) {
        await uploadFiles(messageData.id);
      }

      setNewMessage("");
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
      sendMessage();
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return <User className="h-5 w-5" />;
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl shadow-lg overflow-hidden">
      {/* Header - Style moderne */}
      <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 p-6 border-b border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-primary/20 shadow-md">
              <AvatarImage src={otherUserProfile?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold text-lg">
                {getInitials(otherUserProfile?.full_name || otherUserName)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background shadow-sm" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground mb-0.5">
              {otherUserProfile?.full_name || otherUserName || "Utilisateur"}
            </h3>
            
            {businessTitle && businessSlug && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-sm font-medium hover:text-primary mb-2"
                onClick={() => navigate(`/entreprise/${businessSlug}`)}
              >
                <ExternalLink className="mr-1 h-4 w-4" />
                {businessTitle}
              </Button>
            )}

            {sellerContact && (
              <div className="space-y-1 text-sm">
                {sellerContact.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${sellerContact.email}`} className="hover:text-primary">
                      {sellerContact.email}
                    </a>
                  </div>
                )}
                {sellerContact.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${sellerContact.phone}`} className="hover:text-primary">
                      {sellerContact.phone}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area - Style moderne */}
      <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-background to-muted/5" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Send className="w-10 h-10 text-primary/50" />
              </div>
              <p className="text-muted-foreground text-lg font-medium">
                Aucun message pour le moment
              </p>
              <p className="text-muted-foreground/70 text-sm mt-1">
                Démarrez la conversation !
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.sender_id === currentUserId;
              const attachments = messageAttachments[message.id] || [];
              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8 mb-1 ring-2 ring-background shadow-sm">
                      <AvatarImage src={otherUserProfile?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(otherUserProfile?.full_name || otherUserName)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                      isCurrentUser
                        ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-sm'
                        : 'bg-card border border-border/50 text-foreground rounded-bl-sm'
                    }`}
                  >
                    {message.content !== "[Fichier joint]" && (
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isCurrentUser ? 'text-primary-foreground' : 'text-foreground'}`}>
                        {message.content}
                      </p>
                    )}
                    
                    {attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {attachments.map((att) => {
                          const isImage = att.file_type.startsWith('image/');
                          return (
                            <div
                              key={att.id}
                              className={`${isCurrentUser ? 'bg-primary-foreground/10' : 'bg-muted/50'} rounded-xl p-3 flex items-center gap-3 backdrop-blur-sm`}
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
                    
                    <div className="flex items-center gap-2 mt-2">
                      <p className={`text-xs font-medium ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(message.created_at).toLocaleTimeString('fr-CA', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {isCurrentUser && message.read && (
                        <span className="text-xs text-primary-foreground/70">✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input Area - Style moderne */}
      <div className="p-6 border-t border-border/50 bg-gradient-to-r from-background via-muted/5 to-background backdrop-blur-sm">
        {selectedFiles.length > 0 && (
          <div className="mb-4 space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-card border border-border/50 rounded-xl p-3 text-sm shadow-sm"
              >
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                ) : (
                  <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-3">
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
            className="h-12 w-12 shrink-0 rounded-xl hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Écrivez votre message..."
            className="min-h-[56px] max-h-[120px] resize-none rounded-xl border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            disabled={loading || uploading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || uploading || (!newMessage.trim() && selectedFiles.length === 0)}
            size="icon"
            className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-3 flex items-center gap-1">
          <span>Appuyez sur Entrée pour envoyer</span>
          <span className="text-muted-foreground/50">•</span>
          <span>Max 5 fichiers (10 Mo chacun)</span>
        </p>
      </div>
    </div>
  );
};
