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
import { User, MapPin, Globe, Bell, Mail, Save, Upload } from "lucide-react";
import { AlertsManager } from "@/components/AlertsManager";

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
    street_address: "",
    city: "",
    province: "",
    postal_code: "",
    country: "Canada",
    bio: "",
    is_public: false,
    newsletter_enabled: false,
    marketing_emails: false,
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
          street_address: profileData.street_address || "",
          city: profileData.city || "",
          province: profileData.province || "",
          postal_code: profileData.postal_code || "",
          country: profileData.country || "Canada",
          bio: profileData.bio || "",
          is_public: profileData.is_public || false,
          newsletter_enabled: profileData.newsletter_enabled || false,
          marketing_emails: profileData.marketing_emails || false,
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
          street_address: profile.street_address,
          city: profile.city,
          province: profile.province,
          postal_code: profile.postal_code,
          country: profile.country,
          bio: profile.bio,
          is_public: profile.is_public,
          newsletter_enabled: profile.newsletter_enabled,
          marketing_emails: profile.marketing_emails,
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
        title: "Avatar mis à jour",
        description: "Votre avatar a été enregistré avec succès.",
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

      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Email envoyé",
        description: "Un lien de réinitialisation a été envoyé à votre adresse email.",
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
                Gérez vos informations personnelles et votre avatar.
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
                <span className="hidden sm:inline">Informations personnelles</span>
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Adresse</span>
              </TabsTrigger>
              <TabsTrigger value="public" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Profil public</span>
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
                    Informations personnelles
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <User className="h-5 w-5" />
                    Avatar
                  </CardTitle>
                  <CardDescription>
                    Avatar
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
                          <span>{profile.avatar_url ? "Modifier l'avatar" : "Choisir un fichier"}</span>
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

            <TabsContent value="address" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <MapPin className="h-5 w-5" />
                    Adresse
                  </CardTitle>
                  <CardDescription>
                    Votre adresse complète
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="street_address">Adresse</Label>
                    <Input
                      id="street_address"
                      type="text"
                      value={profile.street_address}
                      onChange={(e) => setProfile({ ...profile, street_address: e.target.value })}
                      placeholder="123 Rue Principale"
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        type="text"
                        value={profile.city}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        placeholder="Montréal"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">Province</Label>
                      <Input
                        id="province"
                        type="text"
                        value={profile.province}
                        onChange={(e) => setProfile({ ...profile, province: e.target.value })}
                        placeholder="Québec"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postal_code">Code postal</Label>
                      <Input
                        id="postal_code"
                        type="text"
                        value={profile.postal_code}
                        onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                        placeholder="H1A 1A1"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Pays</Label>
                      <Input
                        id="country"
                        type="text"
                        value={profile.country}
                        onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                        placeholder="Canada"
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="public" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Globe className="h-5 w-5" />
                    Profil public
                  </CardTitle>
                  <CardDescription>
                    Contrôlez la visibilité de votre profil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="is_public">Profil public</Label>
                      <p className="text-sm text-muted-foreground">
                        Rendre votre profil visible aux autres utilisateurs
                      </p>
                    </div>
                    <Switch
                      id="is_public"
                      checked={profile.is_public}
                      onCheckedChange={(checked) => setProfile({ ...profile, is_public: checked })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Biographie</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Parlez-nous de vous..."
                      className="mt-2 min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Visible uniquement si votre profil est public
                    </p>
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
