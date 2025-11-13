import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Calendar as CalendarIcon, Check, Plus, Trash2, Mail, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const REMINDER_TYPES = [
  { value: 'goal_deadline', label: 'Échéance d\'objectif', icon: '🎯' },
  { value: 'subscription_renewal', label: 'Renouvellement abonnement', icon: '💳' },
  { value: 'budget_overrun', label: 'Dépassement budgétaire', icon: '⚠️' },
  { value: 'tax_optimization', label: 'Optimisation fiscale', icon: '💰' },
  { value: 'custom', label: 'Personnalisé', icon: '📋' },
];

export function BudgetReminders({ isAuthenticated }: { isAuthenticated: boolean }) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [reminderType, setReminderType] = useState('custom');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderDate, setReminderDate] = useState<Date>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('monthly');

  // Fetch reminders
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['budget-reminders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_reminders')
        .select('*')
        .eq('is_completed', false)
        .order('reminder_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
  });

  // Create reminder
  const createReminder = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from('budget_reminders')
        .insert({
          user_id: user.id,
          reminder_type: reminderType,
          title,
          description,
          reminder_date: reminderDate.toISOString(),
          is_recurring: isRecurring,
          recurrence_frequency: isRecurring ? recurrenceFrequency : null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-reminders'] });
      toast.success('✅ Rappel créé !');
      setCreateOpen(false);
      setTitle('');
      setDescription('');
      setReminderDate(new Date());
      setIsRecurring(false);
    },
    onError: (error: any) => {
      toast.error('Erreur : ' + error.message);
    },
  });

  // Complete reminder
  const completeReminder = useMutation({
    mutationFn: async (reminderId: string) => {
      const { error } = await supabase
        .from('budget_reminders')
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq('id', reminderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-reminders'] });
      toast.success('✅ Rappel complété !');
    },
  });

  // Delete reminder
  const deleteReminder = useMutation({
    mutationFn: async (reminderId: string) => {
      const { error } = await supabase
        .from('budget_reminders')
        .delete()
        .eq('id', reminderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-reminders'] });
      toast.success('🗑️ Rappel supprimé');
    },
  });

  const getTypeInfo = (type: string) => {
    return REMINDER_TYPES.find(t => t.value === type) || REMINDER_TYPES[4];
  };

  const isPastDue = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              Rappels intelligents
            </CardTitle>
            <CardDescription>
              Gérez vos alertes budgétaires et fiscales
            </CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouveau rappel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un rappel</DialogTitle>
                <DialogDescription>
                  Configurez un rappel personnalisé pour votre budget
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Type de rappel</Label>
                  <Select value={reminderType} onValueChange={setReminderType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Cotisation REER avant fin mars"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (facultatif)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Détails du rappel..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date du rappel</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !reminderDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {reminderDate ? format(reminderDate, "d MMMM yyyy", { locale: fr }) : "Choisir une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={reminderDate}
                        onSelect={(date) => date && setReminderDate(date)}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                  />
                  <Label htmlFor="recurring" className="cursor-pointer">
                    Rappel récurrent
                  </Label>
                </div>

                {isRecurring && (
                  <div className="space-y-2">
                    <Label>Fréquence</Label>
                    <Select value={recurrenceFrequency} onValueChange={setRecurrenceFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Quotidien</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="monthly">Mensuel</SelectItem>
                        <SelectItem value="yearly">Annuel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button
                onClick={() => createReminder.mutate()}
                disabled={!title || createReminder.isPending}
                className="w-full"
              >
                {createReminder.isPending ? "Création..." : "Créer le rappel"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Bell className="w-16 h-16 text-muted-foreground mx-auto opacity-50" />
            <p className="text-muted-foreground">
              Aucun rappel actif. Créez votre premier rappel !
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder: any) => {
              const typeInfo = getTypeInfo(reminder.reminder_type);
              const pastDue = isPastDue(reminder.reminder_date);

              return (
                <div
                  key={reminder.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                    pastDue ? "border-red-500/50 bg-red-50 dark:bg-red-950/20" : "border-border hover:bg-accent"
                  )}
                >
                  <div className="text-2xl shrink-0">{typeInfo.icon}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold">{reminder.title}</h4>
                      {pastDue && (
                        <Badge variant="destructive" className="shrink-0">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          En retard
                        </Badge>
                      )}
                    </div>
                    
                    {reminder.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {reminder.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {format(new Date(reminder.reminder_date), "d MMM yyyy", { locale: fr })}
                      </span>
                      {reminder.email_sent && (
                        <Badge variant="outline" className="gap-1">
                          <Mail className="w-3 h-3" />
                          Email envoyé
                        </Badge>
                      )}
                      {reminder.is_recurring && (
                        <Badge variant="secondary">Récurrent</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => completeReminder.mutate(reminder.id)}
                      disabled={completeReminder.isPending}
                      title="Marquer comme complété"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReminder.mutate(reminder.id)}
                      disabled={deleteReminder.isPending}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
