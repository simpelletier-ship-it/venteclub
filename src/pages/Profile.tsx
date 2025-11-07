import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Globe, Linkedin, Calendar, User, Lock, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  street_address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  bio: string | null;
  website: string | null;
  linkedin_url: string | null;
  company_name: string | null;
  job_title: string | null;
  created_at: string;
}

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasPremium, setHasPremium] = useState(false);
  const [profileHasPremium, setProfileHasPremium] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
          
          // Check premium status
          const { data: premiumData } = await supabase.functions.invoke('check-premium-subscription');
          setHasPremium(premiumData?.subscribed || false);
        }

        // Fetch profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Erreur",
            description: "Impossible de charger le profil.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setProfile(data);
        
        // Check if the profile user has Club Select
        const { data: premiumStatus } = await supabase
          .from('premium_subscriptions')
          .select('status, current_period_end')
          .eq('user_id', userId)
          .single();
        
        if (premiumStatus && premiumStatus.status === 'active' && new Date(premiumStatus.current_period_end) > new Date()) {
          setProfileHasPremium(true);
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId, navigate, toast]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-bold text-foreground mb-2">Profil introuvable</p>
            <Button onClick={() => navigate(-1)}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.id;

  return (
    <>
      <SEO 
        title={`Profil de ${profile.full_name || 'Utilisateur'}`}
        description={profile.bio || `Voir le profil de ${profile.full_name || 'cet utilisateur'}`}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 hover:bg-muted/50 transition-colors group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Retour
          </Button>

          <Card className="border-border/60 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <Avatar className="h-24 w-24 ring-4 ring-border/40">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground font-bold text-2xl">
                    {getInitials(profile.full_name || profile.email)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CardTitle className="text-2xl">{profile.full_name || 'Utilisateur'}</CardTitle>
                        {profileHasPremium && (
                          <Badge 
                            variant="default" 
                            className="bg-gradient-to-r from-primary to-accent text-white border-0 gap-1"
                          >
                            <Crown className="h-3 w-3" />
                            Membre Club Select
                          </Badge>
                        )}
                      </div>
                      {profile.job_title && profile.company_name && (
                        <p className="text-muted-foreground flex items-center gap-2 mb-2">
                          <Briefcase className="h-4 w-4" />
                          {profile.job_title} chez {profile.company_name}
                        </p>
                      )}
                      {isOwnProfile && (
                        <Badge variant="secondary">Votre profil</Badge>
                      )}
                    </div>
                    {isOwnProfile && (
                      <Button onClick={() => navigate('/settings')} size="sm">
                        Modifier le profil
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6 space-y-6">
              {/* Bio */}
              {profile.bio && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">À propos</h3>
                  <p className="text-foreground">{profile.bio}</p>
                </div>
              )}

              {/* Professional Information - Always visible */}
              {(profile.company_name || profile.job_title) && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Informations professionnelles</h3>
                  <div className="space-y-3">
                    {profile.company_name && (
                      <div className="flex items-center gap-3 text-foreground">
                        <div className="p-2 rounded-lg bg-muted">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Entreprise</p>
                          <p className="font-medium">{profile.company_name}</p>
                        </div>
                      </div>
                    )}

                    {profile.job_title && (
                      <div className="flex items-center gap-3 text-foreground">
                        <div className="p-2 rounded-lg bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Poste</p>
                          <p className="font-medium">{profile.job_title}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Information - Only visible for Club Select members or own profile */}
              {(isOwnProfile || hasPremium) ? (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Coordonnées complètes</h3>
                  <div className="space-y-3">
                    {profile.email && (
                      <div className="flex items-center gap-3 text-foreground">
                        <div className="p-2 rounded-lg bg-muted">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <a href={`mailto:${profile.email}`} className="hover:text-primary transition-colors font-medium">
                            {profile.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {profile.phone && (
                      <div className="flex items-center gap-3 text-foreground">
                        <div className="p-2 rounded-lg bg-muted">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Téléphone</p>
                          <a href={`tel:${profile.phone}`} className="hover:text-primary transition-colors font-medium">
                            {profile.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {(profile.street_address || profile.city || profile.province || profile.postal_code || profile.country) && (
                      <div className="flex items-start gap-3 text-foreground">
                        <div className="p-2 rounded-lg bg-muted">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Adresse complète</p>
                          <div className="font-medium">
                            {profile.street_address && <p>{profile.street_address}</p>}
                            {(profile.city || profile.province || profile.postal_code) && (
                              <p>
                                {profile.city && <span>{profile.city}, </span>}
                                {profile.province && <span>{profile.province} </span>}
                                {profile.postal_code}
                              </p>
                            )}
                            {profile.country && <p>{profile.country}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-6 text-center">
                  <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-semibold mb-2">Coordonnées réservées aux membres Club Select</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Rejoignez le Club Select pour accéder aux coordonnées complètes des utilisateurs
                  </p>
                  <Button onClick={() => navigate('/profile?tab=premium')} size="sm">
                    Rejoindre le Club Select
                  </Button>
                </div>
              )}

              {/* Links */}
              {(profile.website || profile.linkedin_url) && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Liens</h3>
                  <div className="space-y-3">
                    {profile.website && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}

                    {profile.linkedin_url && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Linkedin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <a 
                          href={profile.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Profil LinkedIn
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Member Since */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Membre depuis {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
