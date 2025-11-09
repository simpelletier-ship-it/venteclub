import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePresence = (userId: string | undefined, isActive: boolean = true) => {
  useEffect(() => {
    if (!userId || !isActive) return;

    const channelName = `presence-${userId}`;
    const channel = supabase.channel(channelName);

    // Track user presence
    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence synced for user:', userId);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user as online
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Update last_seen_at in database periodically
    const updateLastSeen = async () => {
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId);
    };

    updateLastSeen();
    const interval = setInterval(updateLastSeen, 30000); // Update every 30 seconds

    return () => {
      clearInterval(interval);
      channel.untrack();
      supabase.removeChannel(channel);
      // Final update on unmount
      updateLastSeen();
    };
  }, [userId, isActive]);
};
