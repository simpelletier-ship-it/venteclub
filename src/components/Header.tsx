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
import { LayoutDashboard, Settings, LogOut, Menu, Sparkles, Mail } from "lucide-react";
import { NotificationBell } from "./NotificationBell";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

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

    // Écouter le scroll
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
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
    <nav className={`border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm transition-all duration-300 ${isScrolled ? 'py-2' : 'py-3 sm:py-4 md:py-6'}`}>
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => navigate("/")}
          >
            <span className={`font-display font-bold text-foreground transition-all duration-300 group-hover:scale-105 ${isScrolled ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl md:text-3xl'}`}>
              Vente<span className="text-secondary">.Club</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className={`hidden lg:flex items-center transition-all duration-300 ${isScrolled ? 'gap-3' : 'gap-4 xl:gap-6'}`}>
            {/* Lien Acheter une entreprise */}
            <button 
              onClick={() => navigate("/entreprises")} 
              className={`text-muted-foreground hover:text-foreground transition-all duration-300 font-semibold relative group whitespace-nowrap ${isScrolled ? 'text-xs' : 'text-sm'}`}
            >
              Acheter une entreprise
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full" />
            </button>

            {/* Lien Vendre une entreprise */}
            <button 
              onClick={() => navigate("/sell")} 
              className={`text-muted-foreground hover:text-foreground transition-all duration-300 font-semibold relative group whitespace-nowrap ${isScrolled ? 'text-xs' : 'text-sm'}`}
            >
              Vendre une entreprise
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full" />
            </button>

            {/* Lien Immobilier commercial */}
            <button 
              onClick={() => navigate("/immeubles-commerciaux")} 
              className={`text-muted-foreground hover:text-foreground transition-all duration-300 font-semibold relative group whitespace-nowrap ${isScrolled ? 'text-xs' : 'text-sm'}`}
            >
              Immobilier commercial
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full" />
            </button>

            {!user && (
              <button 
                onClick={() => navigate("/faq")} 
                className={`text-muted-foreground hover:text-foreground transition-all duration-300 font-semibold relative group ${isScrolled ? 'text-xs' : 'text-sm'}`}
              >
                FAQ
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full" />
              </button>
            )}
            
            {user && (
              <>
                <button 
                  onClick={() => navigate("/messages")} 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-accent/30 hover:bg-accent/50 transition-all duration-300 font-semibold relative group ${isScrolled ? 'text-xs h-8' : 'text-sm h-9'}`}
                >
                  <Mail className={`transition-all duration-300 ${isScrolled ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>Messagerie</span>
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center font-bold shadow-lg">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => navigate("/favorites")} 
                  className={`text-muted-foreground hover:text-foreground transition-all duration-300 font-semibold relative group ${isScrolled ? 'text-xs' : 'text-sm'}`}
                >
                  Favoris
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full" />
                </button>
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
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
                  className={`hidden lg:flex bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold shadow-lg transition-all duration-300 ${isScrolled ? 'px-2 py-1.5 text-xs h-8' : 'px-3 py-2 text-sm h-9'}`}
                >
                  <LayoutDashboard className={`mr-2 transition-all duration-300 ${isScrolled ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>Tableau de bord</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full"
                      aria-label="Menu du profil utilisateur"
                    >
                      <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-secondary/40 hover:border-secondary transition-colors">
                        <AvatarImage 
                          src={getAvatarUrl(profile?.avatar_url, profile?.full_name, user.email)} 
                          alt={profile?.full_name || "Photo de profil"} 
                        />
                        <AvatarFallback className="bg-secondary text-white font-semibold text-sm">
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
                {/* Bouton Connexion visible sur mobile */}
                <Button
                  onClick={() => navigate("/auth")}
                  className="lg:hidden bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold px-3 py-2 h-9 text-xs shadow-lg whitespace-nowrap"
                >
                  Connexion / Créer un compte
                </Button>
                {/* Bouton Connexion desktop */}
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth")}
                  className="hidden lg:inline-flex font-semibold border border-foreground/20 hover:border-foreground/40 hover:bg-accent px-3 py-2 text-sm h-9 whitespace-nowrap"
                >
                  Connexion / Créer un compte
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 space-y-2 border-t border-border pt-4 animate-slide-up">
            {/* Bouton Créer un compte prominent pour les non-connectés */}
            {!user && (
              <div className="px-2 pb-3 mb-2 border-b border-border">
                <Button
                  onClick={() => {
                    navigate("/auth");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold h-11 text-base shadow-lg"
                >
                  Créer un compte
                </Button>
              </div>
            )}
            
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Navigation
            </div>
            <button
              onClick={() => {
                navigate("/entreprises");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              Acheter une entreprise
            </button>
            <button
              onClick={() => {
                navigate("/sell");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              Vendre une entreprise
            </button>
            <button
              onClick={() => {
                navigate("/immeubles-commerciaux");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              Immobilier commercial
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
                  className="w-full text-left px-4 py-2 rounded-lg border border-border/50 bg-accent/30 hover:bg-accent/50 transition-colors flex items-center gap-2 relative"
                >
                  <Mail className="w-4 h-4" />
                  <span>Messagerie</span>
                  {unreadMessagesCount > 0 && (
                    <span className="ml-auto h-5 w-5 rounded-full bg-destructive text-white text-[10px] inline-flex items-center justify-center font-bold">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    navigate("/favorites");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors"
                >
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
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;
