import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Copy, Check, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const TwoFactorAuth = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    loadTwoFactorStatus();
  }, []);

  const loadTwoFactorStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find(f => f.status === 'verified');
      setEnabled(!!totpFactor);
    } catch (error: any) {
      console.error("Error loading 2FA status:", error);
    }
  };

  const handleEnableTwoFactor = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setFactorId(data.id);
        setShowSetup(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'activer 2FA. Veuillez réessayer.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Code invalide",
        description: "Veuillez entrer un code à 6 chiffres.",
      });
      return;
    }

    if (!factorId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Session expirée. Veuillez recommencer.",
      });
      setShowSetup(false);
      return;
    }

    setLoading(true);
    try {
      // Créer un challenge pour vérifier le code TOTP
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId,
      });

      if (challengeError) throw challengeError;

      // Vérifier le code TOTP pour finaliser l'enrollment
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (error) throw error;

      // Générer des codes de backup
      const codes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
      setBackupCodes(codes);

      toast({
        title: "Authentification à deux facteurs activée !",
        description: "Votre compte est maintenant protégé par 2FA. Sauvegardez vos codes de backup.",
      });

      setEnabled(true);
      setShowSetup(false);
      setVerificationCode("");
      setFactorId("");
    } catch (error: any) {
      console.error("2FA verification error:", error);
      toast({
        variant: "destructive",
        title: "Erreur de vérification",
        description: "Le code est incorrect. Assurez-vous d'utiliser le code actuel de votre application d'authentification.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!disableCode || disableCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Code invalide",
        description: "Veuillez entrer un code à 6 chiffres.",
      });
      return;
    }

    setLoading(true);
    try {
      const factors = await supabase.auth.mfa.listFactors();
      const totpFactor = factors.data?.totp?.find(f => f.status === 'verified');
      
      if (!totpFactor) throw new Error("Aucun facteur 2FA trouvé");

      // Créer un challenge pour vérifier le code 2FA (élever à AAL2)
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError) throw challengeError;

      // Vérifier le code 2FA
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: disableCode,
      });

      if (verifyError) throw verifyError;

      // Maintenant on est à AAL2, on peut désinscrire
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id,
      });

      if (unenrollError) throw unenrollError;

      toast({
        title: "2FA désactivée",
        description: "L'authentification à deux facteurs a été désactivée avec succès.",
      });

      setEnabled(false);
      setBackupCodes([]);
      setShowDisableConfirm(false);
      setDisableCode("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message === "Invalid code" || error.message.includes("code")
          ? "Code incorrect. Vérifiez le code dans votre application d'authentification."
          : error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Codes copiés",
      description: "Les codes de backup ont été copiés dans le presse-papiers.",
    });
  };

  if (showDisableConfirm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            Désactiver 2FA
          </CardTitle>
          <CardDescription>
            Pour désactiver 2FA, entrez le code actuel de votre application d'authentification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cette action réduira la sécurité de votre compte
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="disable-code">Code de vérification</Label>
            <Input
              id="disable-code"
              type="text"
              maxLength={6}
              placeholder="000000"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl tracking-widest"
            />
            <p className="text-xs text-muted-foreground text-center">
              Entrez le code à 6 chiffres affiché dans votre application
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDisableConfirm(false);
                setDisableCode("");
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisableTwoFactor}
              disabled={loading || disableCode.length !== 6}
              className="flex-1"
            >
              {loading ? "Désactivation..." : "Désactiver 2FA"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showSetup) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Configuration 2FA
          </CardTitle>
          <CardDescription>
            Scannez le QR code avec votre application d'authentification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Utilisez une application comme Google Authenticator, Authy ou Microsoft Authenticator
            </AlertDescription>
          </Alert>

          <div className="flex justify-center p-4 bg-white rounded-lg">
            <img src={qrCode} alt="QR Code 2FA" className="max-w-[200px]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification-code">Code de vérification</Label>
            <Input
              id="verification-code"
              type="text"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl tracking-widest"
            />
            <p className="text-xs text-muted-foreground text-center">
              Entrez le code à 6 chiffres affiché dans votre application
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSetup(false);
                setVerificationCode("");
                setFactorId("");
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleVerifyAndEnable}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1"
            >
              {loading ? "Vérification..." : "Activer 2FA"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (backupCodes.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            2FA Activée - Codes de backup
          </CardTitle>
          <CardDescription>
            Sauvegardez ces codes en lieu sûr. Ils vous permettront d'accéder à votre compte si vous perdez votre téléphone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ces codes ne seront affichés qu'une seule fois. Sauvegardez-les maintenant !
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
            {backupCodes.map((code, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">{i + 1}.</span>
                <span>{code}</span>
              </div>
            ))}
          </div>

          <Button onClick={copyBackupCodes} className="w-full">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copié !" : "Copier les codes"}
          </Button>

          <Button
            variant="outline"
            onClick={() => setBackupCodes([])}
            className="w-full"
          >
            J'ai sauvegardé mes codes
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Authentification à deux facteurs (2FA)
        </CardTitle>
        <CardDescription>
          Ajoutez une couche de sécurité supplémentaire à votre compte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
          <Shield className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {enabled ? "2FA activée" : "Protégez votre compte"}
            </p>
            <p className="text-xs text-muted-foreground">
              {enabled 
                ? "Votre compte est protégé par l'authentification à deux facteurs."
                : "Activez 2FA pour sécuriser votre compte avec un code temporaire généré par votre téléphone."
              }
            </p>
          </div>
        </div>

        {enabled ? (
          <Button
            variant="destructive"
            onClick={() => setShowDisableConfirm(true)}
            disabled={loading}
            className="w-full"
          >
            Désactiver 2FA
          </Button>
        ) : (
          <Button
            onClick={handleEnableTwoFactor}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Chargement..." : "Activer 2FA"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
