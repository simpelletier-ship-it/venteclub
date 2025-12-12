import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Settings, 
  LogOut, 
  Menu, 
  Sparkles, 
  PiggyBank,
  Calculator,
  Receipt,
  ChevronDown,
  Lightbulb,
  History,
  Target,
  Wallet,
  X,
  User,
  Heart
} from "lucide-react";

import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo - Institutional Style */}
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => navigate("/")}
          >
            <span className="font-semibold text-foreground text-base tracking-tight">
              Vente<span className="text-primary font-semibold">.club</span>
            </span>
          </div>

          {/* Desktop Navigation - Clean Banking Style */}
          <div className="hidden lg:flex items-center gap-1">
            <Button 
              variant="ghost"
              onClick={() => navigate("/budget/planifier")}
              className={cn(
                "h-9 px-3 font-medium text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5",
                isActive('/budget/planifier') && "bg-muted text-foreground"
              )}
            >
              <Target className="h-4 w-4" />
              Mon budget
            </Button>

            <Button 
              variant="ghost"
              onClick={() => navigate("/budget/depenses")}
              className={cn(
                "h-9 px-3 font-medium text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5",
                isActive('/budget/depenses') && "bg-muted text-foreground"
              )}
            >
              <Receipt className="h-4 w-4" />
              Mes dépenses
            </Button>

            <Button 
              variant="ghost"
              onClick={() => navigate("/budget/valeur-nette")}
              className={cn(
                "h-9 px-3 font-medium text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5",
                isActive('/budget/valeur-nette') && "bg-muted text-foreground"
              )}
            >
              <Wallet className="h-4 w-4" />
              Ma valeur nette
            </Button>

            <Button 
              variant="ghost"
              onClick={() => navigate("/budget/analyses")}
              className={cn(
                "h-9 px-3 font-medium text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5",
                isActive('/budget/analyses') && "bg-muted text-foreground"
              )}
            >
              <Lightbulb className="h-4 w-4" />
              Analyses
            </Button>

            {/* Outils Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  className={cn(
                    "h-9 px-3 font-medium text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted gap-1",
                    (isActive('/outils') || isActive('/impots')) && "bg-muted text-foreground"
                  )}
                >
                  <Calculator className="h-4 w-4" />
                  Outils
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 rounded-md border border-border bg-card">
                <DropdownMenuItem onClick={() => navigate("/outils/salaire")} className="cursor-pointer py-2.5 text-sm">
                  <Calculator className="mr-2 h-4 w-4 text-muted-foreground" />
                  Calculateur salaire
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/impots")} className="cursor-pointer py-2.5 text-sm">
                  <Receipt className="mr-2 h-4 w-4 text-muted-foreground" />
                  Impôt – Estimation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="ghost"
              onClick={() => navigate("/soutien")}
              className={cn(
                "h-9 px-3 font-medium text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5",
                isActive('/soutien') && "bg-muted text-foreground"
              )}
            >
              <Heart className="h-4 w-4 text-pink-500" />
              Soutenir
            </Button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {isAdmin && (
              <Button 
                onClick={() => navigate("/admin")}
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 h-8 text-xs font-medium border-border"
              >
                Admin
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-8 w-8 rounded-md"
                    aria-label="Menu du profil"
                  >
                    <Avatar className="h-8 w-8 rounded-md border border-border">
                      <AvatarImage 
                        src={getAvatarUrl(profile?.avatar_url, profile?.full_name, user.email)} 
                        alt={profile?.full_name || "Profil"} 
                      />
                      <AvatarFallback className="rounded-md bg-primary text-primary-foreground font-medium text-xs">
                        {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-md border border-border bg-card">
                  <div className="flex items-center justify-start gap-2 p-3 border-b border-border">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium text-foreground">
                        {profile?.full_name || "Utilisateur"}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => navigate("/budget")} className="cursor-pointer py-2.5 text-sm">
                    <PiggyBank className="mr-2 h-4 w-4 text-muted-foreground" />
                    Mon Budget
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer py-2.5 text-sm">
                    <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer py-2.5 text-sm text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth")}
                  className="hidden lg:inline-flex h-9 font-medium text-sm text-muted-foreground hover:text-foreground"
                >
                  Connexion
                </Button>
                <Button
                  onClick={() => navigate("/auth")}
                  className="h-9 bg-primary hover:bg-primary-light text-primary-foreground font-medium text-sm rounded-md"
                >
                  Commencer
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 text-muted-foreground hover:text-foreground rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu - Optimized for touch */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 space-y-0.5 border-t border-border pt-3 max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain">
            {/* Budget Section */}
            <div className="px-4 py-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget</span>
            </div>
            <button
              onClick={() => {
                navigate("/budget");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-md transition-colors text-sm font-medium flex items-center gap-2",
                isActive('/budget') && !isActive('/budget/planifier') && !isActive('/budget/depenses') && !isActive('/budget/valeur-nette') && !isActive('/budget/analyses')
                  ? "bg-muted text-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Wallet className="h-4 w-4" />
              Tableau de bord
            </button>

            <button
              onClick={() => {
                navigate("/budget/planifier");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-md transition-colors text-sm font-medium flex items-center gap-2",
                isActive('/budget/planifier') ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Target className="h-4 w-4" />
              Mon budget
            </button>

            <button
              onClick={() => {
                navigate("/budget/depenses");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-md transition-colors text-sm font-medium flex items-center gap-2",
                isActive('/budget/depenses') ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Receipt className="h-4 w-4" />
              Mes dépenses
            </button>

            <button
              onClick={() => {
                navigate("/budget/valeur-nette");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-md transition-colors text-sm font-medium flex items-center gap-2",
                isActive('/budget/valeur-nette') ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Lightbulb className="h-4 w-4" />
              Ma valeur nette
            </button>

            <button
              onClick={() => {
                navigate("/budget/analyses");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-md transition-colors text-sm font-medium flex items-center gap-2",
                isActive('/budget/analyses') ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <History className="h-4 w-4" />
              Analyses & conseils
            </button>

            {/* Outils Section */}
            <div className="border-t border-border my-2" />
            <div className="px-4 py-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outils</span>
            </div>
            
            <button
              onClick={() => {
                navigate("/outils/salaire");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-md transition-colors text-sm font-medium flex items-center gap-2",
                isActive('/outils/salaire') ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Calculator className="h-4 w-4" />
              Calculateur salaire
            </button>
            
            <button
              onClick={() => {
                navigate("/impots");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-md transition-colors text-sm font-medium flex items-center gap-2",
                isActive('/impots') ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Receipt className="h-4 w-4" />
              Impôt – Estimation
            </button>

            <button
              onClick={() => {
                navigate("/soutien");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-md transition-colors text-sm font-medium flex items-center gap-2",
                isActive('/soutien') ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Heart className="h-4 w-4 text-pink-500" />
              Soutenir
            </button>
            
            {isAdmin && (
              <>
                <div className="border-t border-border my-2" />
                <button
                  onClick={() => {
                    navigate("/admin");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm font-medium"
                >
                  Admin
                </button>
              </>
            )}

            {user && (
              <>
                <div className="border-t border-border my-2" />
                <button
                  onClick={() => {
                    navigate("/settings");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Paramètres
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;
