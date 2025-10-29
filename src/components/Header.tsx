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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/logout-success");
  };

  return (
    <nav className="border-b border-border/50 glass-effect sticky top-0 z-50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => navigate("/")}
          >
            <span className="text-3xl font-display font-bold transition-transform group-hover:scale-105">
              Vente<span className="text-accent">.</span><span className="text-primary">Club</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => navigate("/")} 
              className="text-foreground/80 hover:text-foreground transition-colors font-medium relative group"
            >
              Parcourir
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </button>
            <button 
              onClick={() => navigate("/map")} 
              className="text-foreground/80 hover:text-foreground transition-colors font-medium relative group"
            >
              Carte Interactive
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </button>
            {user && (
              <>
                <button 
                  onClick={() => navigate("/dashboard")} 
                  className="text-foreground/80 hover:text-foreground transition-colors font-medium flex items-center gap-2 relative group"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                </button>
                <button 
                  onClick={() => navigate("/favorites")} 
                  className="text-foreground/80 hover:text-foreground transition-colors font-medium flex items-center gap-2 relative group"
                >
                  <Heart className="w-4 h-4" />
                  Mes favoris
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
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
                className="hidden md:flex items-center gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                <Sparkles className="w-4 h-4" />
                Admin
              </Button>
            )}

            {user ? (
              <>
                <Button
                  onClick={() => navigate("/list-business")}
                  className="hidden md:flex btn-premium bg-accent hover:bg-primary-dark text-white font-semibold shadow-soft hover:shadow-premium transition-all"
                >
                  Vendre une entreprise
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary/40 transition-colors">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
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
                  className="hidden md:inline-flex font-semibold"
                >
                  Connexion
                </Button>
                <Button
                  onClick={() => navigate("/list-business")}
                  className="hidden md:inline-flex btn-premium bg-accent hover:bg-primary-dark text-white font-semibold"
                >
                  Vendre une entreprise
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-border/50 pt-4 animate-slide-up">
            <button
              onClick={() => {
                navigate("/");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              Parcourir
            </button>
            <button
              onClick={() => {
                navigate("/map");
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              Carte Interactive
            </button>
            {user && (
              <>
                <button
                  onClick={() => {
                    navigate("/dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    navigate("/favorites");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Mes favoris
                </button>
              </>
            )}
            {isAdmin && (
              <button
                onClick={() => {
                  navigate("/admin");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-2 text-accent"
              >
                <Sparkles className="w-4 h-4" />
                Admin
              </button>
            )}
            <Button
              onClick={() => {
                navigate("/list-business");
                setMobileMenuOpen(false);
              }}
              className="w-full btn-premium bg-primary hover:bg-primary-dark text-primary-foreground font-semibold mt-4"
            >
              Vendre une entreprise
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;
