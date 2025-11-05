import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HandCoins } from "lucide-react";

const offerSchema = z.object({
  offer_amount: z.string().min(1, "Le montant est requis"),
  financing_type: z.string().optional(),
  down_payment: z.string().optional(),
  conditions: z.string().optional(),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
});

type OfferFormData = z.infer<typeof offerSchema>;

interface MakeOfferDialogProps {
  businessId: string;
  businessTitle: string;
  askingPrice: number;
}

export const MakeOfferDialog = ({ businessId, businessTitle, askingPrice }: MakeOfferDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      offer_amount: "",
      financing_type: "",
      down_payment: "",
      conditions: "",
      message: "",
    },
  });

  const onSubmit = async (data: OfferFormData) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour faire une offre",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("business_offers" as any).insert({
        business_id: businessId,
        buyer_id: user.id,
        offer_amount: parseFloat(data.offer_amount),
        financing_type: data.financing_type || null,
        down_payment: data.down_payment ? parseFloat(data.down_payment) : null,
        conditions: data.conditions || null,
        message: data.message,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
      });

      if (error) throw error;

      toast({
        title: "Offre envoyée",
        description: "Votre offre a été transmise au vendeur",
      });

      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          <HandCoins className="mr-2 h-4 w-4" />
          Faire une offre
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Faire une offre formelle</DialogTitle>
          <DialogDescription>
            Soumettez une offre d'achat pour {businessTitle}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="offer_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant de l'offre ($) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={`Prix demandé: ${askingPrice.toLocaleString()}`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="financing_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de financement</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type de financement" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Comptant</SelectItem>
                      <SelectItem value="bank">Financement bancaire</SelectItem>
                      <SelectItem value="seller">Financement vendeur</SelectItem>
                      <SelectItem value="mixed">Mixte</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="down_payment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mise de fonds ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Montant de la mise de fonds" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conditions particulières</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Vérification diligente de 30 jours, inspection des locaux, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message au vendeur *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Présentez-vous et expliquez votre motivation pour cette acquisition..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Important:</strong> Cette offre sera transmise au vendeur et sera valide pour 30 jours.
                Le vendeur pourra l'accepter, la rejeter ou faire une contre-offre.
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Envoi..." : "Envoyer l'offre"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
