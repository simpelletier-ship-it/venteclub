import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, CheckCheck, Reply, Image as ImageIcon } from "lucide-react";
import { MessageReactions } from "./MessageReactions";
import { motion } from "framer-motion";
import { getAvatarUrl } from "@/lib/avatarUtils";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean;
  image_url?: string | null;
  reply_to?: {
    id: string;
    content: string;
    sender_name: string;
  } | null;
  reactions?: { [emoji: string]: string[] };
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName: string;
  senderAvatar: string | null;
  senderEmail: string;
  showAvatar: boolean;
  onReply: (message: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  currentUserId: string;
}

export const MessageBubble = ({
  message,
  isOwn,
  senderName,
  senderAvatar,
  senderEmail,
  showAvatar,
  onReply,
  onReact,
  currentUserId,
}: MessageBubbleProps) => {
  const [imageError, setImageError] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {showAvatar ? (
          <Avatar className="h-8 w-8 ring-2 ring-background">
            <AvatarImage 
              src={getAvatarUrl(senderAvatar, senderName, senderEmail)} 
              alt={senderName} 
            />
            <AvatarFallback className="text-xs bg-primary/10">
              {senderName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-8 w-8" />
        )}
      </div>

      {/* Message content */}
      <div className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Reply reference */}
        {message.reply_to && (
          <div className={`text-xs px-3 py-1.5 rounded-lg bg-muted/50 ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Reply className="h-3 w-3" />
              <span className="font-semibold">{message.reply_to.sender_name}</span>
            </div>
            <p className="truncate max-w-xs text-foreground/70">
              {message.reply_to.content}
            </p>
          </div>
        )}

        {/* Main message bubble */}
        <div
          className={`px-4 py-2 rounded-2xl transition-all ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted rounded-tl-sm'
          }`}
        >
          {/* Image if present */}
          {message.image_url && !imageError && (
            <div className="mb-2 rounded-lg overflow-hidden max-w-sm">
              <img
                src={message.image_url}
                alt="Message attachment"
                className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                loading="lazy"
                decoding="async"
                onError={() => setImageError(true)}
                onClick={() => window.open(message.image_url!, '_blank')}
              />
            </div>
          )}

          {/* Text content */}
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Time and read status */}
          <div className={`flex items-center gap-1 mt-1 justify-end ${
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}>
            <span className="text-[10px]">{formatTime(message.created_at)}</span>
            {isOwn && (
              message.read ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )
            )}
          </div>
        </div>

        {/* Reactions */}
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <MessageReactions
            messageId={message.id}
            reactions={message.reactions || {}}
            currentUserId={currentUserId}
            onReact={onReact}
          />
        </div>

        {/* Reply button (visible on hover) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReply(message)}
          className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Reply className="h-3 w-3 mr-1" />
          Répondre
        </Button>
      </div>
    </motion.div>
  );
};
