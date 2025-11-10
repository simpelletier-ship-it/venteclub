/**
 * Utilitaires pour l'optimisation des images
 * Améliore drastiquement les performances de chargement
 */

/**
 * Compresse une image côté client avant l'upload
 * Réduit la taille du fichier de 60-80% sans perte visible de qualité
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculer les nouvelles dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        // Créer un canvas pour la compression
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Améliorer la qualité du rendu
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en Blob avec compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Créer un nouveau File à partir du Blob
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.webp'),
              {
                type: 'image/webp',
                lastModified: Date.now(),
              }
            );
            
            console.log(
              `✅ Image compressée: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${Math.round((1 - compressedFile.size / file.size) * 100)}% de réduction)`
            );
            
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Valide et prépare les images avant l'upload
 * - Vérifie le format
 * - Compresse si nécessaire
 * - Réduit la taille si trop grande
 */
export const prepareImageForUpload = async (
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    maxSize?: number; // en MB
    quality?: number;
  } = {}
): Promise<File> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    maxSize = 2,
    quality = 0.8,
  } = options;

  // Vérifier le type de fichier
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image');
  }

  // Vérifier la taille
  const fileSizeMB = file.size / 1024 / 1024;
  
  if (fileSizeMB <= maxSize && file.type === 'image/webp') {
    // L'image est déjà optimale
    return file;
  }

  // Compresser l'image
  return compressImage(file, maxWidth, maxHeight, quality);
};

/**
 * Précharge une image pour améliorer l'UX
 * Utile pour les images critiques above-the-fold
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Précharge plusieurs images en parallèle
 */
export const preloadImages = async (urls: string[]): Promise<void> => {
  try {
    await Promise.all(urls.map(url => preloadImage(url)));
    console.log(`✅ ${urls.length} images préchargées`);
  } catch (error) {
    console.warn('Erreur lors du préchargement des images:', error);
  }
};
