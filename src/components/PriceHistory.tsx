import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PriceChange {
  id: string;
  old_price: number;
  new_price: number;
  changed_at: string;
}

interface PriceHistoryProps {
  businessId: string;
  currentPrice: number;
  currency?: string;
}

export const PriceHistory = ({ businessId, currentPrice, currency = "CAD" }: PriceHistoryProps) => {
  const [priceHistory, setPriceHistory] = useState<PriceChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      const { data, error } = await supabase
        .from("price_history" as any)
        .select("*")
        .eq("business_id", businessId)
        .order("changed_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setPriceHistory(data as unknown as PriceChange[]);
      }
      setLoading(false);
    };

    fetchPriceHistory();
  }, [businessId]);

  if (loading) return null;
  if (priceHistory.length === 0) return null;

  const calculatePercentageChange = (oldPrice: number, newPrice: number) => {
    return ((newPrice - oldPrice) / oldPrice) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Historique des prix
        </CardTitle>
        <CardDescription>
          Suivez l'évolution du prix demandé pour cette entreprise
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {priceHistory.map((change) => {
            const percentChange = calculatePercentageChange(change.old_price, change.new_price);
            const isIncrease = change.new_price > change.old_price;

            return (
              <div key={change.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  {isIncrease ? (
                    <TrendingUp className="h-5 w-5 text-red-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-muted-foreground">
                        {formatCurrency(change.old_price, currency)}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(change.new_price, currency)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(change.changed_at).toLocaleDateString("fr-CA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div
                  className={`text-sm font-medium ${
                    isIncrease ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {isIncrease ? "+" : ""}
                  {percentChange.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
