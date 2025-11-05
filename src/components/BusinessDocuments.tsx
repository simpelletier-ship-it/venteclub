import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Upload, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface BusinessDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  description: string | null;
  requires_access: boolean;
  created_at: string;
}

interface BusinessDocumentsProps {
  businessId: string;
  sellerId: string;
  hasAccess: boolean;
}

export const BusinessDocuments = ({ businessId, sellerId, hasAccess }: BusinessDocumentsProps) => {
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const isSeller = user?.id === sellerId;

  useEffect(() => {
    fetchDocuments();
  }, [businessId]);

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from("business_documents" as any)
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDocuments(data as unknown as BusinessDocument[]);
    }
    setLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${businessId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("business-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("business_documents" as any).insert({
        business_id: businessId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: user.id,
        requires_access: true,
      });

      if (dbError) throw dbError;

      toast({
        title: "Document ajouté",
        description: "Le document a été téléversé avec succès",
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: BusinessDocument) => {
    if (doc.requires_access && !hasAccess && !isSeller) {
      toast({
        title: "Accès requis",
        description: "Déverrouillez le vendeur pour accéder aux documents",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("business-documents")
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </span>
          {isSeller && (
            <div>
              <input
                type="file"
                id="document-upload"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Button
                size="sm"
                onClick={() => document.getElementById("document-upload")?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "Téléversement..." : "Ajouter"}
              </Button>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          {isSeller
            ? "Partagez des documents avec les acheteurs intéressés"
            : "Documents disponibles pour cette entreprise"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucun document disponible
          </p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString("fr-CA")}
                    </p>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownload(doc)}
                  disabled={doc.requires_access && !hasAccess && !isSeller}
                >
                  {doc.requires_access && !hasAccess && !isSeller ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
