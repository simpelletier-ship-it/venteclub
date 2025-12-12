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
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  Sparkles, 
  PiggyBank,
  Calculator,
  Receipt,
  Building2,
  ChevronDown
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

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

    return () => {
      subscription.unsubscribe();
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

  useEffect(() => {
    if (!user) return;

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

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/logout-success");
  };

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm py-3 sm:py-4">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => navigate("/")}
          >
            <span className="font-display font-bold text-foreground text-xl sm:text-2xl transition-all duration-300 group-hover:scale-105">
              Budget<span className="text-emerald-600 dark:text-emerald-500">.club</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center flex-1 justify-center gap-1">
            {/* Main Budget Link */}
            <Button 
              variant="ghost"
              onClick={() => navigate("/outils/budget")} 
              className="text-muted-foreground hover:text-foreground font-semibold gap-2"
            >
              <PiggyBank className="w-4 h-4" />
              Mon Budget
            </Button>

            {/* Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-semibold gap-1">
                  Outils
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/outils/salaire")} className="cursor-pointer gap-3 py-3">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Calculateur de salaire</p>
                    <p className="text-xs text-muted-foreground">Salaire net au Québec</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/outils/retour-impot")} className="cursor-pointer gap-3 py-3">
                  <Receipt className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Retour d'impôt</p>
                    <p className="text-xs text-muted-foreground">Estimation remboursement</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
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
                  onClick={() => navigate("/outils/budget")}
                  className="hidden lg:flex bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg px-5 py-2.5 text-base h-10"
                >
                  <PiggyBank className="mr-2 w-4 h-4" />
                  <span>Mon Budget</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full"
                      aria-label="Menu du profil utilisateur"
                    >
                      <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-emerald-500/40 hover:border-emerald-500 transition-colors">
                        <AvatarImage 
                          src={getAvatarUrl(profile?.avatar_url, profile?.full_name, user.email)} 
                          alt={profile?.full_name || "Photo de profil"} 
                        />
                        <AvatarFallback className="bg-emerald-600 text-white font-semibold text-sm">
                          {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {profile?.full_name || "Utilisateur"}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Tableau de bord
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
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
                  className="hidden lg:inline-flex font-semibold px-5 py-2.5 text-base h-10"
                >
                  Connexion
                </Button>
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg px-5 py-2.5 text-sm lg:text-base h-9 lg:h-10"
                >
                  Commencer
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
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Budget
            </div>
            <button
              onClick={() => {
                navigate("/outils/budget");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
            >
              <PiggyBank className="w-4 h-4 text-emerald-600" />
              Mon Budget
            </button>
            
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4">
              Outils
            </div>
            <button
              onClick={() => {
                navigate("/outils/salaire");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Calculator className="w-4 h-4 text-blue-600" />
              Calculateur de salaire
            </button>
            <button
              onClick={() => {
                navigate("/outils/retour-impot");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Receipt className="w-4 h-4 text-purple-600" />
              Retour d'impôt
            </button>
            
            
            {user && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4">
                  Mon compte
                </div>
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
              </>
            )}
            
            {isAdmin && (
              <button
                onClick={() => {
                  navigate("/admin");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2 text-emerald-600"
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
