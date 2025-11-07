import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function EmailConfirmed() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setLoading(false);
        
        // Déclencher l'événement de conversion Google Ads
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'conversion', {
            'send_to': 'AW-974642760/z7Q0CLnYktUDEMi839AD'
          });
          console.log('[Google Ads] Conversion "Website traffic" déclenchée');
        }
      } else {
        // Attendre un peu pour voir si la session va se charger
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            setLoading(false);
            
            // Déclencher l'événement de conversion Google Ads
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'conversion', {
                'send_to': 'AW-974642760/z7Q0CLnYktUDEMi839AD'
              });
              console.log('[Google Ads] Conversion "Website traffic" déclenchée');
            }
          } else {
            setError(true);
            setLoading(false);
          }
        }, 2000);
      }
    };

    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Confirmation de votre compte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-destructive/20 shadow-xl">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold mb-3">Erreur de confirmation</h1>
            <p className="text-muted-foreground mb-6">
              Le lien de confirmation a expiré ou est invalide.
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Email confirmé | Vente.Club"
        description="Votre compte Vente.Club a été confirmé avec succès"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-primary/20 shadow-xl">
          <CardContent className="pt-12 pb-8">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-8 h-8 text-accent animate-pulse" />
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Bienvenue au Club ! 🎉
              </h1>
              
              <p className="text-xl text-muted-foreground mb-2">
                Votre compte a été confirmé avec succès
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Vous êtes maintenant membre de Vente.Club
              </h2>
              
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Accédez à des milliers d'opportunités d'affaires au Québec</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Contactez directement les vendeurs et acheteurs</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Publiez vos propres annonces gratuitement</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>Recevez des alertes pour les nouvelles opportunités</span>
                </li>
              </ul>
            </div>

            <div className="bg-accent/10 border-l-4 border-accent rounded-lg p-4 mb-8">
              <p className="text-sm">
                <strong className="text-accent">💡 Conseil du Club :</strong> Complétez votre profil pour inspirer confiance aux vendeurs et augmenter vos chances de succès !
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => navigate("/")} 
                className="flex-1 group"
                size="lg"
              >
                Découvrir les opportunités
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                onClick={() => navigate("/settings")} 
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Compléter mon profil
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Besoin d'aide ? <a href="/contact" className="text-primary hover:underline">Contactez notre équipe</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
