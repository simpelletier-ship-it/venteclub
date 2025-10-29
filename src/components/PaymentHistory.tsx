import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Payment {
  id: string;
  type: 'featured' | 'contact_access' | 'premium';
  amount: number;
  currency: string;
  date: string;
  business_title?: string;
  status: string;
}

export const PaymentHistory = ({ userId }: { userId: string }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadPayments();
    }
  }, [userId]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      // Récupérer les paiements de vedette
      const { data: featuredPayments } = await supabase
        .from('featured_payments')
        .select(`
          id,
          amount,
          currency,
          created_at,
          payment_status,
          businesses (title)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Récupérer les accès contacts
      const { data: contactAccess } = await supabase
        .from('contact_access')
        .select(`
          id,
          created_at,
          used_token,
          businesses (title)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Récupérer les abonnements premium
      const { data: premiumSubs } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const allPayments: Payment[] = [];

      // Transformer les paiements vedette
      if (featuredPayments) {
        featuredPayments.forEach((payment: any) => {
          allPayments.push({
            id: payment.id,
            type: 'featured',
            amount: payment.amount,
            currency: payment.currency,
            date: payment.created_at,
            business_title: payment.businesses?.title,
            status: payment.payment_status,
          });
        });
      }

      // Transformer les accès contacts
      if (contactAccess) {
        contactAccess.forEach((access: any) => {
          allPayments.push({
            id: access.id,
            type: 'contact_access',
            amount: access.used_token ? 0 : 5, // Gratuit si jeton utilisé, sinon estimé à 5$
            currency: 'CAD',
            date: access.created_at,
            business_title: access.businesses?.title,
            status: 'completed',
          });
        });
      }

      // Transformer les abonnements premium
      if (premiumSubs) {
        premiumSubs.forEach((sub: any) => {
          allPayments.push({
            id: sub.id,
            type: 'premium',
            amount: 0, // Le montant n'est pas stocké localement
            currency: 'CAD',
            date: sub.created_at,
            status: sub.status,
          });
        });
      }

      // Trier par date décroissante
      allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setPayments(allPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'featured':
        return 'Mise en vedette';
      case 'contact_access':
        return 'Accès contact';
      case 'premium':
        return 'Abonnement Premium';
      default:
        return type;
    }
  };

  const getPaymentTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'featured':
        return 'default';
      case 'contact_access':
        return 'secondary';
      case 'premium':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Chargement de l'historique...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <CreditCard className="h-5 w-5" />
          Historique des transactions
        </CardTitle>
        <CardDescription>
          Toutes vos transactions sur Vente.Club
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune transaction pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getPaymentTypeBadgeVariant(payment.type) as any}>
                      {getPaymentTypeLabel(payment.type)}
                    </Badge>
                    {payment.status === 'completed' && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        ✓ Complété
                      </Badge>
                    )}
                    {payment.status === 'active' && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Actif
                      </Badge>
                    )}
                  </div>
                  {payment.business_title && (
                    <p className="text-sm font-medium text-foreground">
                      {payment.business_title}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(payment.date), 'dd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {payment.type === 'contact_access' && payment.amount === 0 ? (
                    <p className="text-sm font-semibold text-accent">Jeton gratuit</p>
                  ) : payment.amount > 0 ? (
                    <p className="text-sm font-semibold flex items-center gap-1 text-foreground">
                      <DollarSign className="h-4 w-4" />
                      {payment.amount.toFixed(2)} {payment.currency}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Voir Stripe</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
