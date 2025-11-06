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
    <nav className="border-b border-white/10 bg-gradient-to-r from-[#1e1b4b] to-[#312e81] sticky top-0 z-50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => navigate("/")}
          >
            <span className="text-3xl font-display font-bold transition-transform group-hover:scale-105">
              Vente<span className="text-[#818cf8]">.Club</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => navigate("/")} 
              className="text-white/80 hover:text-white transition-colors font-medium relative group"
            >
              Accueil
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#818cf8] transition-all group-hover:w-full" />
            </button>
            <button 
              onClick={() => navigate("/entreprises")} 
              className="text-white/80 hover:text-white transition-colors font-medium relative group"
            >
              Entreprises
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#818cf8] transition-all group-hover:w-full" />
            </button>
            <button 
              onClick={() => navigate("/immeubles-commerciaux")} 
              className="text-white/80 hover:text-white transition-colors font-medium relative group"
            >
              Immeubles
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#818cf8] transition-all group-hover:w-full" />
            </button>
            <button 
              onClick={() => navigate("/map")} 
              className="text-white/80 hover:text-white transition-colors font-medium relative group"
            >
              Carte
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#818cf8] transition-all group-hover:w-full" />
            </button>
            {user && (
              <>
                <button 
                  onClick={() => navigate("/dashboard")} 
                  className="text-white/80 hover:text-white transition-colors font-medium flex items-center gap-2 relative group"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Tableau de bord
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#818cf8] transition-all group-hover:w-full" />
                </button>
                <button 
                  onClick={() => navigate("/favorites")} 
                  className="text-white/80 hover:text-white transition-colors font-medium flex items-center gap-2 relative group"
                >
                  <Heart className="w-4 h-4" />
                  Favoris
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#818cf8] transition-all group-hover:w-full" />
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
                className="hidden md:flex items-center gap-2 border-[#818cf8] text-[#818cf8] hover:bg-[#818cf8] hover:text-white"
              >
                <Sparkles className="w-4 h-4" />
                Admin
              </Button>
            )}

            {user ? (
              <>
                <Button
                  onClick={() => navigate("/sell")}
                  className="hidden md:flex btn-premium bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold shadow-lg"
                >
                  Je vends
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-10 w-10 rounded-full hover:bg-white/10"
                      aria-label="Menu du profil utilisateur"
                    >
                      <Avatar className="h-10 w-10 border-2 border-[#818cf8]/40 hover:border-[#818cf8] transition-colors">
                        {profile?.avatar_url && (
                          <AvatarImage src={profile.avatar_url} alt={profile?.full_name || "Photo de profil"} />
                        )}
                        <AvatarFallback className="bg-[#6366f1] text-white font-semibold">
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
                  className="hidden md:inline-flex font-semibold text-white hover:bg-white/10"
                >
                  Connexion
                </Button>
                <Button
                  onClick={() => navigate("/sell")}
                  className="hidden md:inline-flex btn-premium bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold"
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
          <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-white/10 pt-4 animate-slide-up">
            <button
              onClick={() => {
                navigate("/");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-white"
            >
              Accueil
            </button>
            <button
              onClick={() => {
                navigate("/entreprises");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-white"
            >
              Entreprises
            </button>
            <button
              onClick={() => {
                navigate("/immeubles-commerciaux");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-white"
            >
              Immeubles
            </button>
            <button
              onClick={() => {
                navigate("/map");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-white"
            >
              Carte
            </button>
            <button
              onClick={() => {
                navigate("/ressources");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-white"
            >
              Ressources
            </button>
            {user && (
              <>
                <button
                  onClick={() => {
                    navigate("/dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-white"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Tableau de bord
                </button>
                <button
                  onClick={() => {
                    navigate("/favorites");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-white"
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
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-[#818cf8]"
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
              className="w-full btn-premium bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold mt-4"
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
