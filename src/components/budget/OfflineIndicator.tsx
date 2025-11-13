import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff, Wifi, RefreshCw, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  onSync: () => void;
}

export const OfflineIndicator = ({ 
  isOnline, 
  pendingCount, 
  isSyncing,
  onSync 
}: OfflineIndicatorProps) => {
  // Only show when offline or has pending transactions
  if (isOnline && pendingCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`mb-4 p-4 border-2 ${
          !isOnline 
            ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-500' 
            : 'bg-blue-50 dark:bg-blue-950/20 border-blue-500'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {!isOnline ? (
                <div className="flex items-center gap-2">
                  <WifiOff className="h-5 w-5 text-orange-600 dark:text-orange-400 animate-pulse" />
                  <div>
                    <p className="font-semibold text-orange-900 dark:text-orange-100">
                      Mode hors ligne
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Les transactions sont enregistrées localement
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      Connexion rétablie
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {isSyncing 
                        ? 'Synchronisation en cours...' 
                        : `${pendingCount} transaction${pendingCount > 1 ? 's' : ''} en attente`
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            {pendingCount > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background border">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{pendingCount}</span>
                </div>
                
                {isOnline && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSync}
                    disabled={isSyncing}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
                  </Button>
                )}
              </div>
            )}
          </div>

          {!isOnline && pendingCount > 0 && (
            <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
              <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-2">
                <Database className="h-3 w-3" />
                {pendingCount} transaction{pendingCount > 1 ? 's' : ''} sera{pendingCount > 1 ? 'ont' : ''} automatiquement synchronisée{pendingCount > 1 ? 's' : ''} lors de la reconnexion
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
