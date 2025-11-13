import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export const useBudgetRealtime = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('budget-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budget_transactions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Budget transaction change detected:', payload);
          
          // Invalider toutes les queries liées au budget pour synchronisation automatique
          queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
          queryClient.invalidateQueries({ queryKey: ['budget-transactions-all'] });
          queryClient.invalidateQueries({ queryKey: ['budget-transactions-current-month'] });
          queryClient.invalidateQueries({ queryKey: ['user-daily-streaks'] });
          queryClient.invalidateQueries({ queryKey: ['user-assets'] });
          queryClient.invalidateQueries({ queryKey: ['user-debts'] });
          queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
          queryClient.invalidateQueries({ queryKey: ['asset-history'] });
          queryClient.invalidateQueries({ queryKey: ['debt-history'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
};
