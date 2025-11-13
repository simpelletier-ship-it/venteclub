import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PendingTransaction {
  id: string;
  amount: number;
  description: string;
  category_id: string;
  type: 'income' | 'expense';
  transaction_date: string;
  tags?: string[];
  timestamp: number;
}

const STORAGE_KEY = 'budget_offline_transactions';

export const useOfflineSync = (isAuthenticated: boolean) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load pending transactions from localStorage
  const loadPendingTransactions = useCallback((): PendingTransaction[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading pending transactions:', error);
      return [];
    }
  }, []);

  // Save pending transactions to localStorage
  const savePendingTransactions = useCallback((transactions: PendingTransaction[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      setPendingCount(transactions.length);
    } catch (error) {
      console.error('Error saving pending transactions:', error);
    }
  }, []);

  // Add transaction to offline queue
  const addOfflineTransaction = useCallback(async (transaction: Omit<PendingTransaction, 'id' | 'timestamp'>) => {
    const pending = loadPendingTransactions();
    const newTransaction: PendingTransaction = {
      ...transaction,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    pending.push(newTransaction);
    savePendingTransactions(pending);
    
    toast.info('💾 Transaction enregistrée hors ligne', {
      description: 'Elle sera synchronisée automatiquement lors de la reconnexion',
      duration: 3000,
    });
    
    return newTransaction;
  }, [loadPendingTransactions, savePendingTransactions]);

  // Sync pending transactions with Supabase
  const syncPendingTransactions = useCallback(async () => {
    if (!isOnline || !isAuthenticated || isSyncing) return;

    const pending = loadPendingTransactions();
    if (pending.length === 0) return;

    setIsSyncing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found for sync');
        setIsSyncing(false);
        return;
      }

      let successCount = 0;
      let failedTransactions: PendingTransaction[] = [];

      // Sync each transaction
      for (const transaction of pending) {
        try {
          const { error } = await supabase
            .from('budget_transactions')
            .insert({
              user_id: user.id,
              amount: transaction.amount,
              description: transaction.description,
              category_id: transaction.category_id,
              type: transaction.type,
              transaction_date: transaction.transaction_date,
            });

          if (error) {
            console.error('Error syncing transaction:', error);
            failedTransactions.push(transaction);
          } else {
            successCount++;
            
            // Insert tags if any
            if (transaction.tags && transaction.tags.length > 0) {
              // First get the newly created transaction ID
              const { data: newTransaction } = await supabase
                .from('budget_transactions')
                .select('id')
                .eq('user_id', user.id)
                .eq('amount', transaction.amount)
                .eq('description', transaction.description)
                .eq('transaction_date', transaction.transaction_date)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              if (newTransaction) {
                // Link tags
                for (const tagName of transaction.tags) {
                  // Get or create tag
                  let { data: tag } = await supabase
                    .from('transaction_tags')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('name', tagName)
                    .single();

                  if (!tag) {
                    const { data: newTag } = await supabase
                      .from('transaction_tags')
                      .insert({ user_id: user.id, name: tagName })
                      .select('id')
                      .single();
                    tag = newTag;
                  }

                  if (tag) {
                    await supabase
                      .from('transaction_tag_links')
                      .insert({
                        transaction_id: newTransaction.id,
                        tag_id: tag.id,
                      });
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error syncing transaction:', error);
          failedTransactions.push(transaction);
        }
      }

      // Save only failed transactions back to storage
      savePendingTransactions(failedTransactions);

      if (successCount > 0) {
        toast.success(`✅ ${successCount} transaction${successCount > 1 ? 's' : ''} synchronisée${successCount > 1 ? 's' : ''}`, {
          description: failedTransactions.length > 0 
            ? `${failedTransactions.length} échouée${failedTransactions.length > 1 ? 's' : ''}, nouvelle tentative plus tard`
            : 'Toutes les transactions hors ligne ont été synchronisées',
          duration: 4000,
        });
      }

      if (failedTransactions.length > 0 && successCount === 0) {
        toast.error('❌ Échec de synchronisation', {
          description: 'Les transactions seront resynchronisées automatiquement',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erreur de synchronisation', {
        description: 'Nouvelle tentative automatique dans quelques instants',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isAuthenticated, isSyncing, loadPendingTransactions, savePendingTransactions]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('🌐 Connexion rétablie', {
        description: 'Synchronisation en cours...',
        duration: 2000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('📡 Mode hors ligne activé', {
        description: 'Les transactions seront enregistrées localement',
        duration: 3000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && isAuthenticated && !isSyncing) {
      const pending = loadPendingTransactions();
      if (pending.length > 0) {
        // Delay sync slightly to ensure connection is stable
        const timer = setTimeout(() => {
          syncPendingTransactions();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, isAuthenticated, isSyncing, loadPendingTransactions, syncPendingTransactions]);

  // Update pending count on mount
  useEffect(() => {
    const pending = loadPendingTransactions();
    setPendingCount(pending.length);
  }, [loadPendingTransactions]);

  // Manual sync trigger
  const triggerSync = useCallback(() => {
    if (isOnline && isAuthenticated) {
      syncPendingTransactions();
    } else if (!isOnline) {
      toast.error('Impossible de synchroniser', {
        description: 'Aucune connexion internet disponible',
      });
    }
  }, [isOnline, isAuthenticated, syncPendingTransactions]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    addOfflineTransaction,
    triggerSync,
    loadPendingTransactions,
  };
};
