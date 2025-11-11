import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, BadgeCheck, Zap, Calendar, TrendingUp, 
  MapPin, Building2, Briefcase, Globe, Linkedin, Mail, Phone,
  Clock, MessageSquare, BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import BusinessCard from "@/components/BusinessCard";
import { SEO } from "@/components/SEO";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SellerStats {
  response_time_hours: number;
  total_responses: number;
  verified_seller: boolean;
  seller_since: string;
  active_listings_count: number;
  total_views: number;
}

interface ResponseStat {
  created_at: string;
  response_time_minutes: number;
}

export default function SellerProfile() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [responseHistory, setResponseHistory] = useState<ResponseStat[]>([]);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (sellerId) {
      checkAccess();
      fetchSellerProfile();
    }
  }, [sellerId]);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Check if user has premium
      const { data: premium } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .gt('current_period_end', new Date().toISOString())
        .maybeSingle();

      if (premium) {
        setHasAccess(true);
        return;
      }

      // Check if user has unlocked at least one business from this seller
      const { data: access } = await supabase
        .from('contact_access')
        .select('business_id')
        .eq('user_id', session.user.id)
        .limit(1);

      if (access && access.length > 0) {
        // Check if any of these businesses belong to this seller
        const businessIds = access.map(a => a.business_id);
        const { data: sellerBusinesses } = await supabase
          .from('businesses')
          .select('id')
          .eq('seller_id', sellerId)
          .in('id', businessIds);

        setHasAccess(sellerBusinesses && sellerBusinesses.length > 0);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    }
  };

  const fetchSellerProfile = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sellerId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch active businesses
      const { data: businessesData } = await supabase
        .from('businesses')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('status', 'active')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      setBusinesses(businessesData || []);

      // Calculate stats
      const totalViews = businessesData?.reduce((sum, b) => sum + (b.views_count || 0), 0) || 0;

      setStats({
        response_time_hours: profileData.response_time_hours || 24,
        total_responses: profileData.total_responses || 0,
        verified_seller: profileData.verified_seller || false,
        seller_since: profileData.seller_since || profileData.created_at,
        active_listings_count: businessesData?.length || 0,
        total_views: totalViews
      });

      // Fetch response history (last 30 days)
      const { data: responseData } = await supabase
        .from('seller_response_stats')
        .select('created_at, response_time_minutes')
        .eq('seller_id', sellerId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      setResponseHistory(responseData || []);
    } catch (error: any) {
      console.error('Error fetching seller profile:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le profil du vendeur.",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateResponseRate = () => {
    if (!stats) return 0;
    return Math.min(100, Math.round((stats.total_responses / (stats.total_responses + 5)) * 100));
  };

  const getAverageResponseTime = () => {
    if (responseHistory.length === 0) return stats?.response_time_hours || 0;
    const avgMinutes = responseHistory.reduce((sum, r) => sum + r.response_time_minutes, 0) / responseHistory.length;
    return Math.round(avgMinutes / 60 * 10) / 10; // Convert to hours with 1 decimal
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Accès Restreint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Vous devez déverrouiller au moins une annonce de ce vendeur ou être membre Club Select pour voir son profil complet.
            </p>
            <Button onClick={() => navigate('/businesses')} className="w-full">
              Parcourir les annonces
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Profil vendeur introuvable</p>
      </div>
    );
  }

  const sellerName = profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Vendeur';
  const responseRate = calculateResponseRate();
  const avgResponseTime = getAverageResponseTime();

  return (
    <>
      <SEO 
        title={`Profil de ${sellerName} - Vente.club`}
        description={profile.bio || `Découvrez le profil professionnel de ${sellerName} et ses annonces sur Vente.club`}
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Profile Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card>
                  <CardHeader className="text-center">
                    <Avatar className="h-32 w-32 mx-auto ring-4 ring-border mb-4">
                      <AvatarImage src={profile.avatar_url} alt={sellerName} />
                      <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary/20 to-accent/20">
                        {sellerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <h1 className="text-2xl font-display font-bold text-foreground">{sellerName}</h1>
                    
                    {/* Badges */}
                    <div className="flex justify-center gap-2 flex-wrap mt-4">
                      {stats?.verified_seller && (
                        <Badge className="bg-blue-500 text-white gap-1">
                          <BadgeCheck className="w-3 h-3" />
                          Vérifié
                        </Badge>
                      )}
                      {stats && stats.response_time_hours <= 2 && (
                        <Badge className="bg-amber-500 text-white gap-1 animate-pulse-glow">
                          <Zap className="w-3 h-3" />
                          Réponse rapide
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Bio */}
                    {profile.bio && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="font-semibold text-sm text-muted-foreground mb-2">À propos</h3>
                          <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
                        </div>
                      </>
                    )}

                    {/* Professional Info */}
                    {(profile.company_name || profile.job_title) && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          {profile.company_name && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-foreground">{profile.company_name}</span>
                            </div>
                          )}
                          {profile.job_title && (
                            <div className="flex items-center gap-2 text-sm">
                              <Briefcase className="w-4 h-4 text-muted-foreground" />
                              <span className="text-foreground">{profile.job_title}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Specialties */}
                    {profile.specialties && profile.specialties.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="font-semibold text-sm text-muted-foreground mb-2">Spécialités</h3>
                          <div className="flex gap-2 flex-wrap">
                            {profile.specialties.map((specialty: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Contact Links */}
                    {(profile.website || profile.linkedin_url) && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          {profile.website && (
                            <a
                              href={profile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <Globe className="w-4 h-4" />
                              Site web
                            </a>
                          )}
                          {profile.linkedin_url && (
                            <a
                              href={profile.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <Linkedin className="w-4 h-4" />
                              LinkedIn
                            </a>
                          )}
                        </div>
                      </>
                    )}

                    <Separator />
                    
                    {/* Member Since */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Membre depuis {format(new Date(stats?.seller_since || profile.created_at), 'MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Statistiques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{responseRate}%</div>
                        <div className="text-xs text-muted-foreground">Taux de réponse</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{avgResponseTime}h</div>
                        <div className="text-xs text-muted-foreground">Temps moyen</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{stats?.active_listings_count}</div>
                        <div className="text-xs text-muted-foreground">Annonces actives</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{stats?.total_views}</div>
                        <div className="text-xs text-muted-foreground">Vues totales</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Content - Businesses & Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Response Time Chart */}
              {responseHistory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Performance des 30 derniers jours
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 flex items-end justify-between gap-1">
                        {responseHistory.slice(-14).map((stat, index) => {
                          const heightPercent = Math.min(100, (stat.response_time_minutes / 240) * 100);
                          const isGood = stat.response_time_minutes <= 120;
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center">
                              <div 
                                className={`w-full rounded-t transition-all ${
                                  isGood ? 'bg-success' : 'bg-orange-500'
                                }`}
                                style={{ height: `${Math.max(5, heightPercent)}%` }}
                              />
                              <div className="text-[8px] text-muted-foreground mt-1 rotate-45 origin-top-left">
                                {format(new Date(stat.created_at), 'dd/MM')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-success" />
                          {"< 2h"}
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-orange-500" />
                          {"> 2h"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Active Businesses */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      Annonces actives ({businesses.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {businesses.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {businesses.map((business) => (
                          <BusinessCard
                            key={business.id}
                            {...business}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Aucune annonce active pour le moment
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Activity Timeline */}
              {responseHistory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Activité récente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {responseHistory.slice(-5).reverse().map((stat, index) => (
                          <div key={index} className="flex items-center gap-4 pb-4 border-b border-border/50 last:border-0">
                            <div className="flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                stat.response_time_minutes <= 120 ? 'bg-success/20' : 'bg-orange-500/20'
                              }`}>
                                <MessageSquare className={`w-5 h-5 ${
                                  stat.response_time_minutes <= 120 ? 'text-success' : 'text-orange-500'
                                }`} />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                Réponse en {Math.round(stat.response_time_minutes / 60 * 10) / 10}h
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(stat.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
