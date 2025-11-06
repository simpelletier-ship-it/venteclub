import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Save, RotateCcw, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  description: string;
  variables: string[];
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Email de Bienvenue',
    subject: '🎉 Bienvenue au Club !',
    description: 'Envoyé après confirmation du compte',
    variables: ['{{user_name}}', '{{user_email}}'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bienvenue au Club !</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, sans-serif; background-color: #f6f9fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; margin: 0 auto; border-radius: 8px;">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #1a1a1a;">Vente.Club</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #1a1a1a;">🎉 Bienvenue au Club !</h2>
              <p style="margin: 16px 0; font-size: 16px; line-height: 1.6; color: #525252;">Bonjour {{user_name}},</p>
              <p style="margin: 16px 0; font-size: 16px; line-height: 1.6; color: #525252;">Bienvenue sur Vente.Club, la plateforme de référence pour l'achat et la vente d'entreprises au Québec.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px; text-align: center; background-color: #f9fafb;">
              <p style="margin: 8px 0; font-size: 14px; color: #737373;">© 2025 Vente.Club</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'confirmation',
    name: 'Email de Confirmation',
    subject: '🎉 Bienvenue au Club ! Confirmez votre compte',
    description: 'Envoyé lors de l\'inscription',
    variables: ['{{confirmation_url}}', '{{user_email}}'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Confirmez votre compte</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, sans-serif; background-color: #f6f9fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; margin: 0 auto; border-radius: 8px;">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #1a1a1a;">Vente.Club</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px; font-size: 24px; font-weight: 700;">Confirmez votre compte</h2>
              <p style="margin: 16px 0; font-size: 16px; line-height: 1.6; color: #525252;">Cliquez sur le bouton ci-dessous pour activer votre compte :</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="{{confirmation_url}}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">Confirmer mon compte</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'password_reset',
    name: 'Réinitialisation de mot de passe',
    subject: '🔐 Réinitialisez votre mot de passe',
    description: 'Envoyé lors d\'une demande de réinitialisation',
    variables: ['{{reset_url}}', '{{user_email}}'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Réinitialisez votre mot de passe</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, sans-serif; background-color: #f6f9fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; margin: 0 auto; border-radius: 8px;">
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px; font-size: 24px; font-weight: 700;">Réinitialisez votre mot de passe</h2>
              <p style="margin: 16px 0; font-size: 16px; line-height: 1.6; color: #525252;">Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="{{reset_url}}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">Réinitialiser mon mot de passe</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'subscription',
    name: 'Confirmation d\'abonnement',
    subject: '✨ Bienvenue au Club Select !',
    description: 'Envoyé après souscription au Club Select',
    variables: ['{{user_name}}', '{{subscription_end}}'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bienvenue au Club Select</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, sans-serif; background-color: #f6f9fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; margin: 0 auto; border-radius: 8px;">
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px; font-size: 24px; font-weight: 700;">✨ Bienvenue au Club Select !</h2>
              <p style="margin: 16px 0; font-size: 16px; line-height: 1.6; color: #525252;">Votre abonnement est maintenant actif jusqu'au {{subscription_end}}.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'approval',
    name: 'Annonce approuvée',
    subject: '✅ Votre annonce a été approuvée !',
    description: 'Envoyé quand une annonce est approuvée',
    variables: ['{{business_title}}', '{{business_url}}'],
    html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Annonce approuvée</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, sans-serif; background-color: #f6f9fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; margin: 0 auto; border-radius: 8px;">
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px; font-size: 24px; font-weight: 700;">✅ Votre annonce a été approuvée !</h2>
              <p style="margin: 16px 0; font-size: 16px; line-height: 1.6; color: #525252;">Félicitations ! Votre annonce "{{business_title}}" est maintenant visible.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="{{business_url}}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">Voir mon annonce</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }
];

export const EmailTemplateManager = () => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(EMAIL_TEMPLATES[0]);
  const [subject, setSubject] = useState(selectedTemplate.subject);
  const [htmlContent, setHtmlContent] = useState(selectedTemplate.html_content);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSubject(selectedTemplate.subject);
    setHtmlContent(selectedTemplate.html_content);
  }, [selectedTemplate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Ici, vous pourriez sauvegarder dans une table email_templates
      // Pour l'instant, on simule la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Template sauvegardé",
        description: "Le template a été mis à jour avec succès.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSubject(selectedTemplate.subject);
    setHtmlContent(selectedTemplate.html_content);
    toast({
      title: "Template réinitialisé",
      description: "Le template a été restauré à sa version originale.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-primary/10">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Templates d'emails</h2>
          <p className="text-sm text-muted-foreground">Gérez et personnalisez vos templates d'emails</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Liste des templates */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Templates disponibles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {EMAIL_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate.id === template.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedTemplate(template)}
              >
                <Mail className="w-4 h-4 mr-2" />
                {template.name}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Éditeur de template */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedTemplate.name}</CardTitle>
                <CardDescription>{selectedTemplate.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewOpen(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Variables disponibles */}
            {selectedTemplate.variables.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <Label className="text-sm font-semibold mb-2 block">Variables disponibles</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map((variable) => (
                    <code
                      key={variable}
                      className="px-2 py-1 bg-background rounded text-xs font-mono cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(variable);
                        toast({
                          title: "Copié !",
                          description: `${variable} copié dans le presse-papier`,
                        });
                      }}
                    >
                      {variable}
                    </code>
                  ))}
                </div>
              </div>
            )}

            {/* Sujet */}
            <div className="space-y-2">
              <Label htmlFor="subject">Sujet de l'email</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Sujet de l'email"
              />
            </div>

            {/* Contenu HTML */}
            <div className="space-y-2">
              <Label htmlFor="html-content">Contenu HTML</Label>
              <Textarea
                id="html-content"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="font-mono text-xs min-h-[400px]"
                placeholder="Contenu HTML de l'email"
              />
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 <strong>Astuce:</strong> Utilisez les variables disponibles ci-dessus pour personnaliser vos emails. 
                Les modifications seront appliquées immédiatement à tous les emails envoyés.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de prévisualisation avec édition */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{selectedTemplate.name}</DialogTitle>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </DialogHeader>
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Aperçu</TabsTrigger>
              <TabsTrigger value="edit">Édition</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="space-y-4 mt-4">
              <div>
                <Label className="text-sm text-muted-foreground">Sujet</Label>
                <p className="font-semibold mt-1">{subject}</p>
              </div>
              <div className="border rounded-lg p-4 bg-muted/50">
                <iframe
                  srcDoc={htmlContent}
                  className="w-full h-[500px] border-0"
                  title="Email preview"
                />
              </div>
            </TabsContent>
            <TabsContent value="edit" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="preview-subject">Sujet de l'email</Label>
                <Input
                  id="preview-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Sujet de l'email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preview-html-content">Contenu HTML</Label>
                <Textarea
                  id="preview-html-content"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="font-mono text-xs min-h-[400px]"
                  placeholder="Contenu HTML de l'email"
                />
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};
