import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/NotificationBell";
import { useToast } from "@/hooks/use-toast";

export const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: hasAdminRole } = await supabase
          .rpc('has_role', { 
            _user_id: session.user.id, 
            _role: 'admin' 
          });
        setIsAdmin(!!hasAdminRole);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: hasAdminRole } = await supabase
          .rpc('has_role', { 
            _user_id: session.user.id, 
            _role: 'admin' 
          });
        setIsAdmin(!!hasAdminRole);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
          <span className="text-3xl font-bold">
            Vente<span className="text-accent">.Club</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate("/")} className="text-foreground hover:text-accent transition-colors font-medium">Parcourir</button>
          <button onClick={() => navigate("/map")} className="text-foreground hover:text-accent transition-colors font-medium">Carte</button>
          {user && (
            <button onClick={() => navigate("/favorites")} className="text-foreground hover:text-accent transition-colors font-medium flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Mes favoris
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <NotificationBell userId={user?.id} />
              {isAdmin && (
                <Button variant="secondary" onClick={() => navigate("/admin")}>
                  Admin
                </Button>
              )}
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => navigate("/settings")}>
                Paramètres
              </Button>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => navigate("/list-business")}>
                Vendre une entreprise
              </Button>
              <Button variant="outline" onClick={async () => {
                await supabase.auth.signOut();
                navigate("/logout-success");
              }}>
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="text-foreground hover:text-accent" onClick={() => navigate("/auth")}>
                Connexion
              </Button>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => navigate("/auth")}>
                Vendre une entreprise
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
