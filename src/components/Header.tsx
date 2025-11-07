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
import { Heart, LayoutDashboard, Settings, LogOut, Menu, Sparkles } from "lucide-react";
import { NotificationBell } from "./NotificationBell";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    if (!user) return;

    // Écouter les changements de profil en temps réel
    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
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
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => navigate("/entreprises")} 
              className="text-muted-foreground hover:text-foreground transition-colors font-medium relative group"
            >
              Entreprises
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full" />
            </button>
            <button 
              onClick={() => navigate("/immeubles-commerciaux")} 
              className="text-muted-foreground hover:text-foreground transition-colors font-medium relative group"
            >
              Immeubles
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full" />
            </button>
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
                  onClick={() => navigate("/dashboard")} 
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-2 relative group"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Tableau de bord
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
                  onClick={() => navigate("/sell")}
                  className="hidden md:flex bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold shadow-lg"
                >
                  Je vends
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-10 w-10 rounded-full"
                      aria-label="Menu du profil utilisateur"
                    >
                      <Avatar className="h-10 w-10 border-2 border-secondary/40 hover:border-secondary transition-colors">
                        {profile?.avatar_url && (
                          <AvatarImage src={profile.avatar_url} alt={profile?.full_name || "Photo de profil"} />
                        )}
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
                  Connexion / Inscription
                </Button>
                <Button
                  onClick={() => navigate("/sell")}
                  className="hidden md:inline-flex bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold"
                >
                  Je vends
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
            <button
              onClick={() => {
                navigate("/entreprises");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              Entreprises
            </button>
            <button
              onClick={() => {
                navigate("/immeubles-commerciaux");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              Immeubles
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
            <Button
              onClick={() => {
                navigate("/sell");
                setMobileMenuOpen(false);
              }}
              className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold mt-4"
            >
              Je vends
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;
