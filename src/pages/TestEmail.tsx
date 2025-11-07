import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, CheckCircle, XCircle } from "lucide-react";

const TestEmail = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("simpelletier@hotmail.com");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log("[TEST] Envoi d'email de test à:", email);
      
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: { to: email }
      });

      if (error) throw error;

      console.log("[TEST] Réponse:", data);

      setResult({
        success: true,
        message: data.message || "Email envoyé avec succès !"
      });

      toast({
        title: "✅ Email envoyé !",
        description: `Un email de test a été envoyé à ${email}`,
      });
    } catch (error: any) {
      console.error("[TEST] Erreur:", error);
      
      setResult({
        success: false,
        message: error.message || "Erreur lors de l'envoi de l'email"
      });

      toast({
        variant: "destructive",
        title: "❌ Erreur",
        description: error.message || "Impossible d'envoyer l'email de test",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">
            Test Email - Vente<span className="text-secondary">.Club</span>
          </h1>
          <p className="text-muted-foreground">
            Testez l'envoi d'emails depuis info@vente.club
          </p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-secondary" />
              Configuration de Test
            </CardTitle>
            <CardDescription>
              Envoyez un email de test pour vérifier la configuration Resend
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email destinataire</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="simpelletier@hotmail.com"
                className="text-base"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Détails de l'envoi
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Expéditeur:</strong> info@vente.club</p>
                <p><strong>Service:</strong> Resend API</p>
                <p><strong>Template:</strong> Email personnalisé Vente.Club</p>
              </div>
            </div>

            <Button
              onClick={handleSendTest}
              disabled={loading || !email}
              className="w-full h-12 text-base"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer l'email de test
                </>
              )}
            </Button>

            {result && (
              <div className={`rounded-lg p-4 ${
                result.success 
                  ? 'bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      result.success 
                        ? 'text-green-900 dark:text-green-100' 
                        : 'text-red-900 dark:text-red-100'
                    }`}>
                      {result.success ? 'Succès !' : 'Erreur'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      result.success 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                ⚠️ Configuration requise
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Assurez-vous que votre domaine <strong>vente.club</strong> est vérifié dans Resend 
                avec les enregistrements DNS (SPF, DKIM, DMARC) configurés.
              </p>
              <a 
                href="https://resend.com/domains" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 underline mt-2 inline-block hover:text-blue-700"
              >
                Vérifier dans Resend →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestEmail;
