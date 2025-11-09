import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Phone, MapPin, Building, Globe, Linkedin, Save, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street_address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  bio: string;
  website: string;
  linkedin_url: string;
  company_name: string;
  job_title: string;
  avatar_url: string;
}

export function ProfileForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    street_address: "",
    city: "",
    province: "",
    postal_code: "",
    country: "Canada",
    bio: "",
    website: "",
    linkedin_url: "",
    company_name: "",
    job_title: "",
    avatar_url: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          street_address: data.street_address || "",
          city: data.city || "",
          province: data.province || "",
          postal_code: data.postal_code || "",
          country: data.country || "Canada",
          bio: data.bio || "",
          website: data.website || "",
          linkedin_url: data.linkedin_url || "",
          company_name: data.company_name || "",
          job_title: data.job_title || "",
          avatar_url: data.avatar_url || "",
        });
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le profil",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      if (!userId) return;

      const file = e.target.files[0];
      
      // Vérifier la taille du fichier (max 2Mo)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Fichier trop volumineux",
          description: "La photo de profil doit faire moins de 2Mo",
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Math.random()}.${fileExt}`;

      setUploading(true);

      // Supprimer l'ancienne photo si elle existe
      if (formData.avatar_url) {
        const oldPath = formData.avatar_url.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFormData({ ...formData, avatar_url: publicUrl });

      // Sauvegarder l'avatar dans la base de données immédiatement
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      toast({
        title: "Photo de profil mise à jour",
        description: "Votre photo de profil a été enregistrée avec succès",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de télécharger la photo",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Générer le full_name à partir de first_name et last_name
      const full_name = `${formData.first_name} ${formData.last_name}`.trim();

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          full_name: full_name,
          phone: formData.phone,
          street_address: formData.street_address,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postal_code,
          country: formData.country,
          bio: formData.bio,
          website: formData.website,
          linkedin_url: formData.linkedin_url,
          company_name: formData.company_name,
          job_title: formData.job_title,
          avatar_url: formData.avatar_url,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le profil",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const initials = `${formData.first_name} ${formData.last_name}`.trim();
    if (!initials) return formData.email.substring(0, 2).toUpperCase();
    return initials
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Photo de profil
          </CardTitle>
          <CardDescription>
            Votre photo de profil sera visible par les autres utilisateurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 ring-4 ring-border/40">
              <AvatarImage src={formData.avatar_url || undefined} alt={`${formData.first_name} ${formData.last_name}`} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground font-bold text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="avatar_file" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Upload className="h-4 w-4" />
                  <span>{formData.avatar_url ? "Modifier la photo" : "Télécharger une photo"}</span>
                </div>
                <Input
                  id="avatar_file"
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  className="w-full"
                  onClick={() => document.getElementById('avatar_file')?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choisir un fichier
                    </>
                  )}
                </Button>
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPG, GIF, WEBP (Max 2Mo)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                type="text"
                placeholder="Jean"
                required
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom de famille *</Label>
              <Input
                id="last_name"
                type="text"
                placeholder="Dupont"
                required
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              disabled
              value={formData.email}
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              L'email ne peut pas être modifié depuis le profil
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <div className="flex gap-2">
              <Phone className="h-5 w-5 text-muted-foreground mt-2" />
              <Input
                id="phone"
                type="tel"
                placeholder="514-555-1234"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biographie</Label>
            <Textarea
              id="bio"
              placeholder="Parlez de vous, de votre expérience..."
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Informations professionnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Informations professionnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Entreprise</Label>
            <Input
              id="company_name"
              type="text"
              placeholder="Nom de votre entreprise"
              value={formData.company_name}
              onChange={(e) =>
                setFormData({ ...formData, company_name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_title">Titre du poste</Label>
            <Input
              id="job_title"
              type="text"
              placeholder="Votre fonction"
              value={formData.job_title}
              onChange={(e) =>
                setFormData({ ...formData, job_title: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Adresse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Adresse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street_address">Rue</Label>
            <Input
              id="street_address"
              type="text"
              placeholder="123 Rue Principale"
              value={formData.street_address}
              onChange={(e) =>
                setFormData({ ...formData, street_address: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                type="text"
                placeholder="Montréal"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Input
                id="province"
                type="text"
                placeholder="Québec"
                value={formData.province}
                onChange={(e) =>
                  setFormData({ ...formData, province: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Code postal</Label>
              <Input
                id="postal_code"
                type="text"
                placeholder="H1A 1A1"
                value={formData.postal_code}
                onChange={(e) =>
                  setFormData({ ...formData, postal_code: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input
                id="country"
                type="text"
                placeholder="Canada"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liens sociaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Liens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website">Site web</Label>
            <div className="flex gap-2">
              <Globe className="h-5 w-5 text-muted-foreground mt-2" />
              <Input
                id="website"
                type="url"
                placeholder="https://monsite.com"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <div className="flex gap-2">
              <Linkedin className="h-5 w-5 text-muted-foreground mt-2" />
              <Input
                id="linkedin_url"
                type="url"
                placeholder="https://linkedin.com/in/votre-profil"
                value={formData.linkedin_url}
                onChange={(e) =>
                  setFormData({ ...formData, linkedin_url: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} size="lg" className="gap-2">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Enregistrer le profil
            </>
          )}
        </Button>
      </div>
    </form>
  );
}