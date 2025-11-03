import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Globe, Linkedin, Calendar, User } from "lucide-react";
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
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
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement du profil...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-bold text-foreground mb-2">Profil introuvable</p>
              <Button onClick={() => navigate(-1)}>Retour</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const isOwnProfile = currentUserId === profile.id;

  return (
    <Layout>
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
                      <CardTitle className="text-2xl mb-2">{profile.full_name || 'Utilisateur'}</CardTitle>
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

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Coordonnées</h3>
                <div className="space-y-3">
                  {profile.email && (
                    <div className="flex items-center gap-3 text-foreground">
                      <div className="p-2 rounded-lg bg-muted">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <a href={`mailto:${profile.email}`} className="hover:text-primary transition-colors">
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
                        <a href={`tel:${profile.phone}`} className="hover:text-primary transition-colors">
                          {profile.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {(profile.street_address || profile.city || profile.province) && (
                    <div className="flex items-center gap-3 text-foreground">
                      <div className="p-2 rounded-lg bg-muted">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Adresse</p>
                        <p>
                          {profile.street_address && <span>{profile.street_address}<br /></span>}
                          {profile.city && <span>{profile.city}, </span>}
                          {profile.province && <span>{profile.province} </span>}
                          {profile.postal_code}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
    </Layout>
  );
}
