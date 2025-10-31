import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, CreditCard, Bell, Mail, Save, Upload, Shield } from "lucide-react";
import { AlertsManager } from "@/components/AlertsManager";
import { TwoFactorAuth } from "@/components/TwoFactorAuth";
import { PaymentHistory } from "@/components/PaymentHistory";
import { PremiumSubscription } from "@/components/PremiumSubscription";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    avatar_url: "",
    bio: "",
    is_public: false,
    newsletter_enabled: false,
    marketing_emails: false,
    date_of_birth: "",
    linkedin_url: "",
    company_name: "",
    job_title: "",
  });
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      setProfile(prev => ({ ...prev, email: session.user.email || "" }));

      // Load profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        setProfile({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          phone: profileData.phone || "",
          email: session.user.email || "",
          avatar_url: profileData.avatar_url || "",
          bio: profileData.bio || "",
          is_public: profileData.is_public || false,
          newsletter_enabled: profileData.newsletter_enabled || false,
          marketing_emails: profileData.marketing_emails || false,
          date_of_birth: profileData.date_of_birth || "",
          linkedin_url: profileData.linkedin_url || "",
          company_name: profileData.company_name || "",
          job_title: profileData.job_title || "",
        });
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          email: profile.email,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          is_public: profile.is_public,
          newsletter_enabled: profile.newsletter_enabled,
          marketing_emails: profile.marketing_emails,
          date_of_birth: profile.date_of_birth || null,
          linkedin_url: profile.linkedin_url,
          company_name: profile.company_name,
          job_title: profile.job_title,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      if (!user) return;

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      setUploading(true);

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfile({ ...profile, avatar_url: publicUrl });

      // Sauvegarder l'avatar dans la base de données immédiatement
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Photo de profil mise à jour",
        description: "Votre photo de profil a été enregistrée avec succès.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!profile.email) return;

      // Use custom edge function to send password reset email with custom sender
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: profile.email,
          redirectUrl: `${window.location.origin}/reset-password`
        }
      });

      if (error) throw error;

      toast({
        title: "Email envoyé",
        description: "Un lien de réinitialisation a été envoyé à votre adresse email. Si vous ne recevez pas l'email, vérifiez vos courriels indésirables.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Mon Profil
              </h1>
              <p className="text-muted-foreground">
                Gérez vos informations personnelles et votre photo de profil.
              </p>
            </div>
            <Button onClick={handleUpdateProfile} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer les modifications
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Personnel</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Abonnement</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Sécurité</span>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Alertes</span>
              </TabsTrigger>
              <TabsTrigger value="newsletter" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Infolettre</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <Card>
                  <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <User className="h-5 w-5" />
                    Informations personnelles
                  </CardTitle>
                  <CardDescription>
                    Ces informations seront visibles par les vendeurs lors de vos échanges.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name" className="flex items-center gap-2">
                        Prénom <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="first_name"
                        type="text"
                        value={profile.first_name}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        placeholder="Jean"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name" className="flex items-center gap-2">
                        Nom de famille <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="last_name"
                        type="text"
                        value={profile.last_name}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        placeholder="Dupont"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Téléphone mobile</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="Ex: 514-555-1234"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2">
                        Courriel <span className="text-muted-foreground text-xs">(non modifiable)</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-muted mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date_of_birth">Date de naissance</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={profile.date_of_birth}
                        onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin_url">Profil LinkedIn</Label>
                      <Input
                        id="linkedin_url"
                        type="url"
                        value={profile.linkedin_url}
                        onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                        placeholder="https://linkedin.com/in/votre-profil"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_name">Entreprise</Label>
                      <Input
                        id="company_name"
                        type="text"
                        value={profile.company_name}
                        onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                        placeholder="Nom de votre entreprise"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="job_title">Titre de poste</Label>
                      <Input
                        id="job_title"
                        type="text"
                        value={profile.job_title}
                        onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                        placeholder="Ex: Entrepreneur, Investisseur"
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <User className="h-5 w-5" />
                    Photo de profil
                  </CardTitle>
                  <CardDescription>
                    Photo de profil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} />
                      <AvatarFallback className="text-2xl">
                        <User className="h-10 w-10" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Label htmlFor="avatar" className="cursor-pointer">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Upload className="h-4 w-4" />
                          <span>{profile.avatar_url ? "Modifier la photo de profil" : "Choisir un fichier"}</span>
                        </div>
                        <Input
                          id="avatar"
                          type="file"
                          accept="image/png,image/jpeg,image/gif,image/webp"
                          onChange={handleAvatarUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF, WEBP (Max 2Mo).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sécurité</CardTitle>
                  <CardDescription>
                    Gérez votre mot de passe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={handleChangePassword}
                    className="w-full"
                  >
                    Réinitialiser le mot de passe
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Un email avec un lien de réinitialisation vous sera envoyé
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informations du compte</CardTitle>
                  <CardDescription>
                    Détails de votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm font-medium">Identifiant</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {user?.id?.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium">Créé le</span>
                    <span className="text-sm text-muted-foreground">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-CA') : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <PremiumSubscription userId={user?.id} />
              <PaymentHistory userId={user?.id} />
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <TwoFactorAuth />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Shield className="h-5 w-5" />
                    Tentatives de connexion récentes
                  </CardTitle>
                  <CardDescription>
                    Surveillez l'activité de votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <p>✅ Authentification à deux facteurs disponible</p>
                    <p>🔒 Limite de 3 tentatives de connexion avant verrouillage temporaire</p>
                    <p>⏱️ Verrouillage de 30 minutes après tentatives échouées</p>
                    <p>🔐 Mots de passe sécurisés avec critères stricts (12+ caractères)</p>
                    <p>🚫 Protection contre la réutilisation de mots de passe</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts">
              <AlertsManager userId={user?.id} />
            </TabsContent>

            <TabsContent value="newsletter" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Mail className="h-5 w-5" />
                    Préférences de communication
                  </CardTitle>
                  <CardDescription>
                    Gérez vos préférences d'emails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="newsletter_enabled">Infolettre</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir notre infolettre hebdomadaire avec les nouvelles annonces
                      </p>
                    </div>
                    <Switch
                      id="newsletter_enabled"
                      checked={profile.newsletter_enabled}
                      onCheckedChange={(checked) => setProfile({ ...profile, newsletter_enabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketing_emails">Emails marketing</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir des offres spéciales et des promotions
                      </p>
                    </div>
                    <Switch
                      id="marketing_emails"
                      checked={profile.marketing_emails}
                      onCheckedChange={(checked) => setProfile({ ...profile, marketing_emails: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
