import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Circle } from "lucide-react";

interface OnlineStatusProps {
  userId: string;
  showLabel?: boolean;
}

export const OnlineStatus = ({ userId, showLabel = false }: OnlineStatusProps) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    const channelName = `presence-${userId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const userPresence = presenceState[userId];
        setIsOnline(!!userPresence && userPresence.length > 0);
        
        if (!userPresence || userPresence.length === 0) {
          // User is offline, get last seen from database
          fetchLastSeen();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchLastSeen = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('last_seen_at')
      .eq('id', userId)
      .single();
    
    if (data?.last_seen_at) {
      setLastSeen(data.last_seen_at);
    }
  };

  const getLastSeenText = () => {
    if (!lastSeen) return "Hors ligne";
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `il y a ${diffMins}min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `il y a ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `il y a ${diffDays}j`;
  };

  return (
    <div className="flex items-center gap-1.5">
      <Circle 
        className={`w-2 h-2 ${isOnline ? 'fill-green-500 text-green-500' : 'fill-muted-foreground/40 text-muted-foreground/40'}`}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {isOnline ? "En ligne" : getLastSeenText()}
        </span>
      )}
    </div>
  );
};
