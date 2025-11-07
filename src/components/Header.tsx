import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/avatarUtils";
import { Heart, LayoutDashboard, Settings, LogOut, Menu, Sparkles, MessageSquare, ShoppingBag, Building2, Store, ChevronDown } from "lucide-react";
import { NotificationBell } from "./NotificationBell";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
        fetchProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data);
  };

  const fetchUnreadMessages = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('read', false);

    setUnreadMessagesCount(count || 0);
  };

  useEffect(() => {
    if (!user) return;

    // Fetch initial unread messages count
    fetchUnreadMessages();

    // Écouter les changements de profil en temps réel
    const profileChannel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          setProfile(payload.new);
        }
      )
      .subscribe();

    // Écouter les changements de messages en temps réel
    const messagesChannel = supabase
      .channel('header-unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => fetchUnreadMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/logout-success");
  };

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => navigate("/")}
          >
            <span className="text-3xl font-display font-bold text-foreground transition-transform group-hover:scale-105">
              Vente<span className="text-secondary">.Club</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {/* Menu Acheter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors font-medium relative group flex items-center gap-1">
                  <ShoppingBag className="w-4 h-4" />
                  Acheter
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-card/95 backdrop-blur-xl border-border/50 shadow-premium">
                <DropdownMenuItem onClick={() => navigate("/entreprises")} className="cursor-pointer hover:bg-muted/50 flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Entreprises</p>
                    <p className="text-xs text-muted-foreground">Commerces et PME</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/immeubles-commerciaux")} className="cursor-pointer hover:bg-muted/50 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Immobilier</p>
                    <p className="text-xs text-muted-foreground">Commercial et résidentiel</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menu Vendre */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors font-medium relative group flex items-center gap-1">
                  <Store className="w-4 h-4" />
                  Vendre
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-card/95 backdrop-blur-xl border-border/50 shadow-premium">
                <DropdownMenuItem onClick={() => navigate("/sell")} className="cursor-pointer hover:bg-muted/50">
                  <Store className="mr-2 h-4 w-4" />
                  <div>
                    <p className="font-medium">Mon entreprise</p>
                    <p className="text-xs text-muted-foreground">Commerce, PME, franchise</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/sell?type=property")} className="cursor-pointer hover:bg-muted/50">
                  <Building2 className="mr-2 h-4 w-4" />
                  <div>
                    <p className="font-medium">Mon immeuble</p>
                    <p className="text-xs text-muted-foreground">Commercial, résidentiel</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {!user && (
              <button 
                onClick={() => navigate("/faq")} 
                className="text-muted-foreground hover:text-foreground transition-colors font-medium relative group"
              >
                FAQ
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full" />
              </button>
            )}
            
            {user && (
              <>
                <button 
                  onClick={() => navigate("/messages")} 
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-2 relative group"
                >
                  <div className="relative">
                    <MessageSquare className="w-4 h-4" />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                      </span>
                    )}
                  </div>
                  Messagerie
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full" />
                </button>
                <button 
                  onClick={() => navigate("/favorites")} 
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-2 relative group"
                >
                  <Heart className="w-4 h-4" />
                  Favoris
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full" />
                </button>
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {user && <NotificationBell userId={user.id} />}
            
            {isAdmin && (
              <Button 
                onClick={() => navigate("/admin")}
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Admin
              </Button>
            )}

            {user ? (
              <>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="hidden md:flex bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold shadow-lg"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-10 w-10 rounded-full"
                      aria-label="Menu du profil utilisateur"
                    >
                      <Avatar className="h-10 w-10 border-2 border-secondary/40 hover:border-secondary transition-colors">
                        <AvatarImage 
                          src={getAvatarUrl(profile?.avatar_url, profile?.full_name, user.email)} 
                          alt={profile?.full_name || "Photo de profil"} 
                        />
                        <AvatarFallback className="bg-secondary text-white font-semibold">
                          {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border-border/50 shadow-premium">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {profile?.full_name || "Utilisateur"}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer hover:bg-muted/50">
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-muted/50 text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth")}
                  className="hidden md:inline-flex font-semibold border border-black"
                >
                  Connexion
                </Button>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="hidden md:inline-flex bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold shadow-lg"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-border pt-4 animate-slide-up">
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Acheter
            </div>
            <button
              onClick={() => {
                navigate("/entreprises");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
              Entreprises
            </button>
            <button
              onClick={() => {
                navigate("/immeubles-commerciaux");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Immobilier
            </button>
            {!user && (
              <button
                onClick={() => {
                  navigate("/faq");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                FAQ
              </button>
            )}
            {user && (
              <>
                <button
                  onClick={() => {
                    navigate("/ressources");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  Ressources
                </button>
                <button
                  onClick={() => {
                    navigate("/dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Tableau de bord
                </button>
                <button
                  onClick={() => {
                    navigate("/messages");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <div className="relative">
                    <MessageSquare className="w-4 h-4" />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                      </span>
                    )}
                  </div>
                  Messagerie
                </button>
                <button
                  onClick={() => {
                    navigate("/favorites");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Favoris
                </button>
              </>
            )}
            {isAdmin && (
              <button
                onClick={() => {
                  navigate("/admin");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2 text-secondary"
              >
                <Sparkles className="w-4 h-4" />
                Admin
              </button>
            )}
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4">
              Vendre
            </div>
            <button
              onClick={() => {
                navigate("/sell");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
              Mon entreprise
            </button>
            <button
              onClick={() => {
                navigate("/sell?type=property");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Mon immeuble
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;
