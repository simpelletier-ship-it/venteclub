import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Monitor, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TrustedDevice {
  id: string;
  device_fingerprint: string;
  device_name: string | null;
  trusted_until: string;
  created_at: string;
}

export const TrustedDevices = () => {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDevices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error: any) {
      console.error('Error loading trusted devices:', error);
      toast.error('Erreur lors du chargement des appareils');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deviceId: string) => {
    setDeletingId(deviceId);
    try {
      const { error } = await supabase
        .from('trusted_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      toast.success('Appareil retiré de la liste de confiance');
      await loadDevices();
    } catch (error: any) {
      console.error('Error deleting trusted device:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Appareils de confiance
        </CardTitle>
        <CardDescription>
          Gérez les appareils où le code 2FA n'est pas requis pendant 30 jours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun appareil de confiance enregistré
          </p>
        ) : (
          devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {device.device_name || 'Appareil sans nom'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Ajouté le {format(new Date(device.created_at), 'PPP', { locale: fr })}
                </div>
                <div className="text-sm text-muted-foreground">
                  Expire le {format(new Date(device.trusted_until), 'PPP', { locale: fr })}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(device.id)}
                disabled={deletingId === device.id}
              >
                {deletingId === device.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
