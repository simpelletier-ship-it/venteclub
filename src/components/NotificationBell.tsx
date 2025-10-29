import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  business_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  userId: string | undefined;
}

export const NotificationBell = ({ userId }: NotificationBellProps) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      fetchUnreadMessages();
      
      // Subscribe to realtime changes for notifications
      const notifChannel = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          () => fetchNotifications()
        )
        .subscribe();

      // Subscribe to realtime changes for messages
      const messagesChannel = supabase
        .channel('unread-messages')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
          () => fetchUnreadMessages()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notifChannel);
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [userId]);

  const fetchUnreadMessages = async () => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('read', false);

    setUnreadMessagesCount(count || 0);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    fetchNotifications();
  };

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    fetchNotifications();
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Pour les notifications de nouvelle annonce créée par le vendeur, aller au dashboard
    if (notification.type === 'new_listing' && notification.message.includes('soumise avec succès')) {
      navigate('/dashboard');
    } else if (notification.type === 'new_message' || notification.type === 'contact_purchased') {
      // Pour les notifications de messages, aller à la messagerie
      navigate('/messages');
    } else if (notification.type === 'approved') {
      // Pour les notifications d'approbation, aller vers l'annonce
      navigate(`/business/${notification.business_id}`);
    } else {
      // Pour toutes les autres notifications, aller vers l'annonce
      navigate(`/business/${notification.business_id}`);
    }
  };

  if (!userId) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {(unreadCount + unreadMessagesCount) > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount + unreadMessagesCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[640px] max-w-[95vw] z-50">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {unreadMessagesCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/messages')}
              >
                {unreadMessagesCount} message{unreadMessagesCount > 1 ? 's' : ''} non lu{unreadMessagesCount > 1 ? 's' : ''}
              </Button>
            )}
          </div>
          <ScrollArea className="h-96 w-full overflow-x-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucune notification
              </p>
            ) : (
              <div className="space-y-3 pr-2">
                {notifications.map((notification) => {
                  const getNotificationStyle = (type: string) => {
                    switch (type) {
                      case 'approved':
                        return 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800';
                      case 'new_listing':
                        return 'bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 border-blue-200 dark:border-blue-800';
                      case 'price_drop':
                        return 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800';
                      case 'sold':
                        return 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800';
                      case 'contact_purchased':
                        return 'bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20 border-cyan-200 dark:border-cyan-800';
                      case 'high_views':
                        return 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800';
                      default:
                        return 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border-slate-200 dark:border-slate-800';
                    }
                  };

                  // Extract business name from message (text between quotes)
                  const businessNameMatch = notification.message.match(/"([^"]+)"/);
                  const businessName = businessNameMatch ? businessNameMatch[1] : null;
                  
                  // Split message around business name
                  let messageParts = notification.message;
                  if (businessName) {
                    messageParts = notification.message.split(`"${businessName}"`).join('|||BUSINESS|||');
                  }

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-4 rounded-xl cursor-pointer transition-all duration-300 relative group border-2 ${
                        getNotificationStyle(notification.type)
                      } ${
                        notification.read 
                          ? "opacity-70 hover:opacity-100" 
                          : "shadow-md hover:shadow-lg"
                      }`}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                          onClick={(e) => deleteNotification(notification.id, e)}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                        
                        <div className="pr-8">
                          <p className="text-sm leading-relaxed text-foreground">
                            {businessName ? (
                              messageParts.split('|||BUSINESS|||').map((part, index) => (
                                <span key={index}>
                                  {part}
                                  {index < messageParts.split('|||BUSINESS|||').length - 1 && (
                                    <span className="font-bold text-primary">
                                      {businessName}
                                    </span>
                                  )}
                                </span>
                              ))
                            ) : (
                              notification.message
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.created_at).toLocaleDateString('fr-CA', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};
