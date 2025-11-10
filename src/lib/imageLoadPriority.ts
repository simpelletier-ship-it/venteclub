/**
 * Système de priorisation dynamique des images
 * Gère l'ordre de chargement basé sur la position, vélocité et direction du scroll
 */

interface ImageLoadRequest {
  id: string;
  priority: number;
  distance: number;
  timestamp: number;
  element: HTMLElement;
  callback: () => void;
}

class ImageLoadQueue {
  private queue: ImageLoadRequest[] = [];
  private loading = new Set<string>();
  private loaded = new Set<string>();
  private maxConcurrent = 4; // Nombre max d'images chargées simultanément
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startProcessing();
  }

  /**
   * Calcule la priorité d'une image basée sur:
   * - Distance du viewport (plus proche = plus prioritaire)
   * - Vélocité du scroll (scroll rapide = anticipation plus loin)
   * - Direction du scroll (prioriser les images dans la direction du scroll)
   */
  calculatePriority(
    element: HTMLElement,
    scrollVelocity: number,
    scrollDirection: 'up' | 'down' | 'idle'
  ): { priority: number; distance: number } {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Distance du centre de l'image au viewport
    const imageCenter = rect.top + rect.height / 2;
    let distance = Math.abs(imageCenter - viewportHeight / 2);
    
    // Ajuster selon la direction du scroll
    if (scrollDirection === 'down' && rect.top > 0) {
      // Scroll vers le bas: prioriser images en dessous
      distance = rect.top;
    } else if (scrollDirection === 'up' && rect.bottom < viewportHeight) {
      // Scroll vers le haut: prioriser images au dessus
      distance = viewportHeight - rect.bottom;
    }
    
    // Facteur de vélocité: plus on scroll vite, plus on anticipe loin
    const velocityFactor = Math.min(scrollVelocity / 1000, 2); // Max 2x
    const anticipationDistance = distance - (velocityFactor * 300); // Anticipe jusqu'à 600px
    
    // Calculer priorité (plus bas = plus prioritaire)
    // Images dans le viewport ont priorité absolue
    let priority = anticipationDistance;
    
    if (rect.top < viewportHeight && rect.bottom > 0) {
      // Image dans le viewport: priorité maximale
      priority = -1000 - distance;
    }
    
    return { priority, distance: Math.abs(distance) };
  }

  /**
   * Ajoute une requête de chargement d'image à la queue
   */
  enqueue(
    id: string,
    element: HTMLElement,
    callback: () => void,
    scrollVelocity: number = 0,
    scrollDirection: 'up' | 'down' | 'idle' = 'idle'
  ): void {
    // Si déjà chargée ou en cours, ignorer
    if (this.loaded.has(id) || this.loading.has(id)) {
      return;
    }

    // Calculer la priorité
    const { priority, distance } = this.calculatePriority(
      element,
      scrollVelocity,
      scrollDirection
    );

    // Créer la requête
    const request: ImageLoadRequest = {
      id,
      priority,
      distance,
      timestamp: Date.now(),
      element,
      callback,
    };

    // Ajouter à la queue
    this.queue.push(request);
    
    // Trier par priorité (plus bas = plus prioritaire)
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Met à jour les priorités de toutes les images en queue
   */
  updatePriorities(scrollVelocity: number, scrollDirection: 'up' | 'down' | 'idle'): void {
    this.queue.forEach(request => {
      const { priority, distance } = this.calculatePriority(
        request.element,
        scrollVelocity,
        scrollDirection
      );
      request.priority = priority;
      request.distance = distance;
    });
    
    // Re-trier la queue
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Démarre le traitement de la queue
   */
  private startProcessing(): void {
    if (this.processingInterval) return;

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 100); // Traiter toutes les 100ms
  }

  /**
   * Traite la queue et charge les images prioritaires
   */
  private processQueue(): void {
    // Nettoyer les anciennes requêtes (> 5 secondes)
    const now = Date.now();
    this.queue = this.queue.filter(req => now - req.timestamp < 5000);

    // Charger les images selon la limite de concurrent
    while (this.loading.size < this.maxConcurrent && this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) break;

      this.loading.add(request.id);
      
      // Exécuter le callback de chargement
      try {
        request.callback();
      } catch (error) {
        console.error('[IMAGE-QUEUE] Error loading image:', error);
      }
      
      // Marquer comme chargée après un délai
      setTimeout(() => {
        this.loading.delete(request.id);
        this.loaded.add(request.id);
      }, 100);
    }
  }

  /**
   * Arrête le traitement
   */
  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.queue = [];
    this.loading.clear();
    this.loaded.clear();
  }
}

// Instance globale singleton
let globalQueue: ImageLoadQueue | null = null;

export const getImageLoadQueue = (): ImageLoadQueue => {
  if (!globalQueue) {
    globalQueue = new ImageLoadQueue();
  }
  return globalQueue;
};

export const destroyImageLoadQueue = (): void => {
  if (globalQueue) {
    globalQueue.destroy();
    globalQueue = null;
  }
};
