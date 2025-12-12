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
  X
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";
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
    <nav className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => navigate("/budget")}
          >
            <span className="font-display font-bold text-white text-xl transition-all duration-300 group-hover:scale-105">
              Budget<span className="text-emerald-500">.club</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Budget - Main */}
            <Button 
              variant="ghost"
              onClick={() => navigate("/budget")} 
              className={cn(
                "font-medium gap-2 text-slate-300 hover:text-white hover:bg-slate-800",
                isActive('/budget') && !isActive('/budget/historique') && !isActive('/budget/objectifs') && !isActive('/budget/valeur-nette') && "bg-slate-800 text-white"
              )}
            >
              <PiggyBank className="w-4 h-4" />
              Budget
            </Button>

            {/* Historique */}
            <Button 
              variant="ghost"
              onClick={() => navigate("/budget/historique")} 
              className={cn(
                "font-medium gap-2 text-slate-300 hover:text-white hover:bg-slate-800",
                isActive('/budget/historique') && "bg-slate-800 text-white"
              )}
            >
              <History className="w-4 h-4" />
              Historique
            </Button>

            {/* Objectifs */}
            <Button 
              variant="ghost"
              onClick={() => navigate("/budget/objectifs")} 
              className={cn(
                "font-medium gap-2 text-slate-300 hover:text-white hover:bg-slate-800",
                isActive('/budget/objectifs') && "bg-slate-800 text-white"
              )}
            >
              <Target className="w-4 h-4" />
              Objectifs
            </Button>

            {/* Valeur nette */}
            <Button 
              variant="ghost"
              onClick={() => navigate("/budget/valeur-nette")} 
              className={cn(
                "font-medium gap-2 text-slate-300 hover:text-white hover:bg-slate-800",
                isActive('/budget/valeur-nette') && "bg-slate-800 text-white"
              )}
            >
              <Wallet className="w-4 h-4" />
              Valeur nette
            </Button>

            {/* Outils Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "font-medium gap-1 text-slate-300 hover:text-white hover:bg-slate-800",
                    (isActive('/outils/salaire') || isActive('/outils/retour-impot')) && "bg-slate-800 text-white"
                  )}
                >
                  <Calculator className="w-4 h-4" />
                  Outils
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 bg-slate-900 border-slate-800">
                <DropdownMenuItem onClick={() => navigate("/outils/salaire")} className="cursor-pointer gap-3 py-3 text-slate-300 hover:text-white focus:text-white focus:bg-slate-800">
                  <Calculator className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Calculateur de salaire</p>
                    <p className="text-xs text-slate-500">Salaire net au Québec</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/outils/retour-impot")} className="cursor-pointer gap-3 py-3 text-slate-300 hover:text-white focus:text-white focus:bg-slate-800">
                  <Receipt className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="font-medium">Retour d'impôt</p>
                    <p className="text-xs text-slate-500">Estimation remboursement</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Blog/Tips */}
            <Button 
              variant="ghost"
              onClick={() => navigate("/blog")} 
              className={cn(
                "font-medium gap-2 text-slate-300 hover:text-white hover:bg-slate-800",
                isActive('/blog') && "bg-slate-800 text-white"
              )}
            >
              <Lightbulb className="w-4 h-4" />
              Astuces
            </Button>
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
                className="hidden md:flex items-center gap-2 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <Sparkles className="w-4 h-4" />
                Admin
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-9 w-9 rounded-full"
                    aria-label="Menu du profil"
                  >
                    <Avatar className="h-9 w-9 border-2 border-emerald-500/40 hover:border-emerald-500 transition-colors">
                      <AvatarImage 
                        src={getAvatarUrl(profile?.avatar_url, profile?.full_name, user.email)} 
                        alt={profile?.full_name || "Profil"} 
                      />
                      <AvatarFallback className="bg-emerald-600 text-white font-semibold text-sm">
                        {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold text-white">
                        {profile?.full_name || "Utilisateur"}
                      </p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem onClick={() => navigate("/budget")} className="cursor-pointer text-slate-300 hover:text-white focus:text-white focus:bg-slate-800">
                    <PiggyBank className="mr-2 h-4 w-4" />
                    Mon Budget
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer text-slate-300 hover:text-white focus:text-white focus:bg-slate-800">
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-slate-800">
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
                  className="hidden lg:inline-flex font-medium text-slate-300 hover:text-white"
                >
                  Connexion
                </Button>
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Commencer
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 text-slate-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 space-y-1 border-t border-slate-800 pt-4 animate-slide-up">
            <button
              onClick={() => {
                navigate("/budget");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3",
                isActive('/budget') && !isActive('/budget/historique') && !isActive('/budget/objectifs') && !isActive('/budget/valeur-nette') 
                  ? "bg-emerald-600/10 text-emerald-400" 
                  : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <PiggyBank className="w-5 h-5" />
              <span className="font-medium">Budget</span>
            </button>

            <button
              onClick={() => {
                navigate("/budget/historique");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3",
                isActive('/budget/historique') ? "bg-emerald-600/10 text-emerald-400" : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <History className="w-5 h-5" />
              <span className="font-medium">Historique</span>
            </button>

            <button
              onClick={() => {
                navigate("/budget/objectifs");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3",
                isActive('/budget/objectifs') ? "bg-emerald-600/10 text-emerald-400" : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <Target className="w-5 h-5" />
              <span className="font-medium">Objectifs</span>
            </button>

            <button
              onClick={() => {
                navigate("/budget/valeur-nette");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3",
                isActive('/budget/valeur-nette') ? "bg-emerald-600/10 text-emerald-400" : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <Wallet className="w-5 h-5" />
              <span className="font-medium">Valeur nette</span>
            </button>

            <div className="border-t border-slate-800 my-2" />
            
            <button
              onClick={() => {
                navigate("/outils/salaire");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3",
                isActive('/outils/salaire') ? "bg-blue-600/10 text-blue-400" : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <Calculator className="w-5 h-5" />
              <span className="font-medium">Calculateur salaire</span>
            </button>
            
            <button
              onClick={() => {
                navigate("/outils/retour-impot");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3",
                isActive('/outils/retour-impot') ? "bg-purple-600/10 text-purple-400" : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <Receipt className="w-5 h-5" />
              <span className="font-medium">Retour d'impôt</span>
            </button>
            
            <button
              onClick={() => {
                navigate("/blog");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3",
                isActive('/blog') ? "bg-amber-600/10 text-amber-400" : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <Lightbulb className="w-5 h-5" />
              <span className="font-medium">Astuces & Blog</span>
            </button>
            
            {isAdmin && (
              <button
                onClick={() => {
                  navigate("/admin");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-3"
              >
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="font-medium">Admin</span>
              </button>
            )}

            {user && (
              <>
                <div className="border-t border-slate-800 my-2" />
                <button
                  onClick={() => {
                    navigate("/settings");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-3"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Paramètres</span>
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
