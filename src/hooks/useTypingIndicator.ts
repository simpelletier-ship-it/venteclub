import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useTypingIndicator = (
  conversationId: string,
  userId: string
) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const channel = supabase.channel(`typing-${conversationId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const typing = new Set<string>();
        
        Object.values(presenceState).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id !== userId && presence.typing) {
              typing.add(presence.user_id);
            }
          });
        });
        
        setTypingUsers(typing);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  const startTyping = useCallback(async () => {
    if (isTyping) return;
    
    const channel = supabase.channel(`typing-${conversationId}`);
    await channel.subscribe();
    await channel.track({
      user_id: userId,
      typing: true,
    });
    setIsTyping(true);
  }, [conversationId, userId, isTyping]);

  const stopTyping = useCallback(async () => {
    if (!isTyping) return;
    
    const channel = supabase.channel(`typing-${conversationId}`);
    await channel.untrack();
    setIsTyping(false);
  }, [conversationId, isTyping]);

  return {
    isOtherUserTyping: typingUsers.size > 0,
    startTyping,
    stopTyping,
  };
};
