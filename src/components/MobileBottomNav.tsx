import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, Heart, MessageSquare, User } from "lucide-react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "./ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('read', false);
      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    const channel = supabase
      .channel('mobile-nav-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setIsVisible(currentScroll < lastScroll || currentScroll < 50);
      setLastScroll(currentScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScroll]);

  if (!isMobile) return null;

  const navItems = [
    { icon: Home, label: 'Accueil', path: '/' },
    { icon: Search, label: 'Recherche', path: '/entreprises' },
    { icon: Heart, label: 'Favoris', path: '/favorites' },
    { icon: MessageSquare, label: 'Messages', path: '/messages', badge: unreadCount },
    { icon: User, label: 'Profil', path: userId ? '/dashboard' : '/auth' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t border-border md:hidden shadow-lg"
      style={{ 
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingTop: '0.5rem',
        paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.5rem, env(safe-area-inset-right))'
      }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] py-1 px-2 rounded-lg active:bg-muted/50 transition-colors touch-manipulation"
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className={`relative transition-transform duration-200 ${active ? 'scale-105' : 'scale-100'}`}>
                <Icon 
                  className={`w-5 h-5 transition-colors ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`} 
                  strokeWidth={active ? 2.5 : 2}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge 
                    className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full p-0 flex items-center justify-center bg-destructive text-white text-[9px] font-bold border-2 border-card"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors leading-tight ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};
