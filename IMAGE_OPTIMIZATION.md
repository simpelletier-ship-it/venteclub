# Optimisation des Images - Guide de développement

## Vue d'ensemble

Ce projet utilise plusieurs techniques d'optimisation d'images pour améliorer les performances, particulièrement sur mobile :

1. **Lazy Loading natif** - Les images sont chargées uniquement quand elles deviennent visibles
2. **Support WebP** - Format d'image moderne avec meilleure compression
3. **Composants réutilisables** - APIs cohérentes pour gérer les images
4. **Preloading intelligent** - Préchargement des images critiques

## Composants disponibles

### OptimizedImage

Composant principal pour afficher des images optimisées.

**Caractéristiques :**
- ✅ Lazy loading natif
- ✅ Support WebP avec fallback automatique
- ✅ Skeleton pendant le chargement
- ✅ Gestion d'erreurs avec fallback personnalisable
- ✅ Responsive et accessible

**Utilisation de base :**

```tsx
import { OptimizedImage } from "@/components/OptimizedImage";

<OptimizedImage
  src="/path/to/image.jpg"
  alt="Description de l'image"
  className="w-full h-full object-cover"
  aspectRatio="16/9"
/>
```

**Props disponibles :**

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `src` | `string` | - | URL de l'image (requis) |
| `alt` | `string` | - | Texte alternatif (requis) |
| `fallback` | `ReactNode` | - | Contenu à afficher en cas d'erreur |
| `aspectRatio` | `string` | - | Ratio d'aspect CSS (ex: "16/9") |
| `objectFit` | `string` | `"cover"` | Mode d'ajustement de l'image |
| `className` | `string` | - | Classes CSS supplémentaires |

**Exemple avec fallback personnalisé :**

```tsx
<OptimizedImage
  src={imageUrl}
  alt="Photo d'entreprise"
  aspectRatio="4/3"
  fallback={
    <div className="flex items-center justify-center bg-muted">
      <p>Image non disponible</p>
    </div>
  }
/>
```

### Hooks de Preloading

Pour les images critiques qui doivent être chargées immédiatement (hero images, above-the-fold).

**useImagePreload - Précharger une seule image :**

```tsx
import { useImagePreload } from "@/hooks/useImagePreload";

const HeroSection = () => {
  const { isLoaded, error } = useImagePreload("/hero-image.jpg");
  
  return (
    <div>
      {isLoaded ? (
        <img src="/hero-image.jpg" alt="Hero" />
      ) : (
        <Skeleton />
      )}
    </div>
  );
};
```

**useImagesPreload - Précharger plusieurs images :**

```tsx
import { useImagesPreload } from "@/hooks/useImagePreload";

const Gallery = () => {
  const images = ["/img1.jpg", "/img2.jpg", "/img3.jpg"];
  const { loadedCount, isAllLoaded } = useImagesPreload(images);
  
  return (
    <div>
      <p>Chargé : {loadedCount}/{images.length}</p>
      {isAllLoaded && <div>Toutes les images sont chargées!</div>}
    </div>
  );
};
```

## Bonnes pratiques

### 1. Utilisez OptimizedImage partout

❌ **Évitez :**
```tsx
<img src={url} alt="..." loading="lazy" />
```

✅ **Préférez :**
```tsx
<OptimizedImage src={url} alt="..." />
```

### 2. Spécifiez toujours le ratio d'aspect

Cela évite le "layout shift" pendant le chargement :

```tsx
<OptimizedImage
  src={url}
  alt="..."
  aspectRatio="16/9"  // ✅ Bon
/>
```

### 3. Utilisez des textes alternatifs descriptifs

❌ **Évitez :**
```tsx
<OptimizedImage src={url} alt="image" />
```

✅ **Préférez :**
```tsx
<OptimizedImage 
  src={url} 
  alt="Restaurant italien dans le Vieux-Montréal avec terrasse"
/>
```

### 4. Préchargez les images critiques

Pour les images "above-the-fold" ou hero sections :

```tsx
const HeroSection = () => {
  const { isLoaded } = useImagePreload(heroImageUrl);
  
  // L'image commence à se charger immédiatement
  return <OptimizedImage src={heroImageUrl} alt="..." />;
};
```

## Format WebP

Le composant `OptimizedImage` tente automatiquement d'utiliser le format WebP :

1. **Images Supabase Storage** : Utilise l'URL directe (Supabase gère l'optimisation)
2. **Images locales (.jpg, .png)** : Tente de charger la version .webp
3. **Fallback automatique** : Si WebP échoue, charge le format original

**Exemple de structure de fichiers :**

```
src/assets/
├── hero.jpg      # Format original
├── hero.webp     # Version optimisée
├── logo.png      # Format original
└── logo.webp     # Version optimisée
```

## Performances

### Impact sur les Core Web Vitals

- **LCP (Largest Contentful Paint)** : Lazy loading + preloading des images hero
- **CLS (Cumulative Layout Shift)** : Utilisation de aspectRatio pour réserver l'espace
- **FID (First Input Delay)** : Chargement différé des images non critiques

### Métriques de performance attendues

Sur mobile 3G :
- ⚡ Réduction de ~40% du temps de chargement initial
- 📉 Réduction de ~60% de la bande passante utilisée
- 🎯 CLS < 0.1 avec aspectRatio défini

## Debugging

### Vérifier si WebP est supporté

```tsx
const supportsWebP = () => {
  const elem = document.createElement('canvas');
  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
};
```

### Monitorer le chargement des images

Ouvrez la console du navigateur pour voir les logs de chargement d'images.

### Tester sur mobile

1. Ouvrir DevTools
2. Activer le throttling réseau (Slow 3G)
3. Observer le comportement du lazy loading

## Migration d'images existantes

Pour convertir des images existantes :

```bash
# Installer cwebp (outil de conversion WebP)
brew install webp  # macOS
sudo apt-get install webp  # Linux

# Convertir une image
cwebp -q 80 image.jpg -o image.webp

# Convertir en batch
for img in *.jpg; do cwebp -q 80 "$img" -o "${img%.jpg}.webp"; done
```

## Support navigateur

| Navigateur | Support WebP | Lazy Loading |
|------------|--------------|--------------|
| Chrome 85+ | ✅ | ✅ |
| Firefox 79+ | ✅ | ✅ |
| Safari 14+ | ✅ | ✅ |
| Edge 85+ | ✅ | ✅ |
| iOS Safari 14+ | ✅ | ✅ |

Les navigateurs plus anciens utilisent automatiquement les formats fallback.

## Ressources supplémentaires

- [Web.dev - Optimize Images](https://web.dev/fast/#optimize-your-images)
- [MDN - Lazy Loading](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading)
- [Can I Use - WebP](https://caniuse.com/webp)
