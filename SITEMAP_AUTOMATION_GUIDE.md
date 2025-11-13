# 🗺️ Guide d'Automatisation du Sitemap Dynamique

## Vue d'ensemble

Le système de génération automatique de sitemap est maintenant en place avec:
- **Génération dynamique** via Edge Function
- **Régénération automatique** via triggers database
- **Cache intelligent** avec rate limiting (5 minutes)
- **Logging complet** de toutes les générations

## 🏗️ Architecture

```
┌─────────────────────┐
│  Nouveau Business   │
│  ou Blog Post       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Database Trigger   │
│  (auto-régénère)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌──────────────────┐
│ Rate Limiter (5min) │────►│  Cache Check     │
└──────────┬──────────┘     └──────────────────┘
           │
           ▼
┌─────────────────────┐
│   Edge Function     │
│  generate-sitemap   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Sitemap XML        │
│  + Cache Save       │
│  + Generation Log   │
└─────────────────────┘
```

## 📊 Tables Database

### 1. `sitemap_cache`
Stocke le sitemap généré pour éviter les régénérations inutiles.

```sql
CREATE TABLE sitemap_cache (
  id UUID PRIMARY KEY,
  xml_content TEXT NOT NULL,        -- Le XML complet du sitemap
  generated_at TIMESTAMP NOT NULL,   -- Quand il a été généré
  entry_count INTEGER NOT NULL       -- Nombre d'URLs dans le sitemap
);
```

**Usage:**
- 1 seule entrée à la fois (l'ancienne est supprimée)
- Accessible en lecture publique
- Cache valide pendant 5 minutes

### 2. `sitemap_generation_log`
Historique complet de toutes les générations.

```sql
CREATE TABLE sitemap_generation_log (
  id UUID PRIMARY KEY,
  trigger_source TEXT NOT NULL,      -- 'manual', 'business_update', 'blog_update', 'scheduled'
  entry_count INTEGER NOT NULL,      -- Nombre d'URLs générées
  generation_time_ms INTEGER NOT NULL, -- Temps de génération en ms
  generated_at TIMESTAMP NOT NULL
);
```

**Accessible par:** Admins uniquement

## 🔄 Déclencheurs Automatiques

### Trigger 1: Nouveau Business / Modification
```sql
CREATE TRIGGER trigger_sitemap_on_business
AFTER INSERT OR UPDATE OR DELETE ON businesses
FOR EACH ROW
EXECUTE FUNCTION auto_regenerate_sitemap_on_business();
```

**Se déclenche quand:**
- ✅ Un business est créé et approuvé
- ✅ Un business est approuvé (status passe à 'approved')
- ✅ Un business actif est modifié
- ✅ Un business actif est supprimé

**Ne se déclenche PAS pour:**
- ❌ Businesses en attente (pending)
- ❌ Businesses rejetés (rejected)
- ❌ Businesses archivés (archived)

### Trigger 2: Nouveau Blog Post / Modification
```sql
CREATE TRIGGER trigger_sitemap_on_blog
AFTER INSERT OR UPDATE OR DELETE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION auto_regenerate_sitemap_on_blog();
```

**Se déclenche quand:**
- ✅ Un article est publié (published = true)
- ✅ Un article publié est modifié
- ✅ Un article publié est supprimé

**Ne se déclenche PAS pour:**
- ❌ Articles en brouillon (published = false)

## ⚡ Rate Limiting Intelligent

### Système de Protection
```typescript
// Vérifier la dernière génération
v_time_since_last = now() - last_generation_time

// Si moins de 5 minutes ET pas une demande manuelle
if (v_time_since_last < 300 && source != 'manual') {
  return { success: false, wait_time: 300 - v_time_since_last }
}
```

**Comportement:**
- **Automatique:** Maximum 1 génération / 5 minutes
- **Manuel:** Toujours autorisé (bypass le rate limiter)

**Pourquoi 5 minutes?**
- Évite les régénérations excessives lors de multiples modifications
- Suffisant pour que les changements soient indexés par Google
- Réduit la charge serveur

## 🎯 Contenu du Sitemap

### Pages Statiques (13 entrées)
```xml
- / (homepage)              Priority: 1.0
- /businesses               Priority: 0.9
- /blog                     Priority: 0.9
- /outils                   Priority: 0.9
- /outils/salaire           Priority: 0.95 ⭐
- /outils/retour-impot      Priority: 0.95 ⭐
- /outils/budget            Priority: 0.95 ⭐
- /map                      Priority: 0.8
- /about                    Priority: 0.7
- /contact                  Priority: 0.7
- /sell                     Priority: 0.8
- /list-business            Priority: 0.8
- /faq                      Priority: 0.7
- /resources                Priority: 0.7
```

### Contenu Dynamique
```xml
- Businesses actifs approuvés   Priority: 0.8
- Articles de blog publiés      Priority: 0.7
- 10 villes du Québec          Priority: 0.7
```

## 🔧 Fonctions Disponibles

### 1. Régénération Manuelle
```sql
-- Depuis SQL
SELECT trigger_sitemap_regeneration('manual');

-- Retourne
{
  "success": true,
  "message": "Sitemap regeneration triggered",
  "source": "manual"
}
```

### 2. Vérifier le Cache
```sql
SELECT 
  entry_count,
  generated_at,
  EXTRACT(EPOCH FROM (now() - generated_at)) as seconds_old
FROM sitemap_cache
ORDER BY generated_at DESC
LIMIT 1;
```

### 3. Voir l'Historique
```sql
SELECT 
  trigger_source,
  entry_count,
  generation_time_ms,
  generated_at
FROM sitemap_generation_log
ORDER BY generated_at DESC
LIMIT 20;
```

## 📈 Monitoring & Analytics

### Headers de Réponse
L'Edge Function retourne des headers informatifs:

```http
X-Sitemap-Source: fresh | cache
X-Sitemap-Entries: 245
X-Generation-Time: 1234ms
Cache-Control: public, max-age=300
```

### Logs Console
```
[SITEMAP] Starting generation from source: business_update
[SITEMAP] Generated sitemap with 245 entries in 1234ms
[SITEMAP] - 189 businesses
[SITEMAP] - 33 blog posts
[SITEMAP] - 10 cities
[SITEMAP] - 13 static pages (including 3 tools)
[SITEMAP] Saved to cache
[SITEMAP] Logged generation
```

## 🚀 Utilisation

### Accès Direct au Sitemap
```
GET https://xmwsrvaricrfxovimffm.supabase.co/functions/v1/generate-sitemap
```

### Via Frontend
```typescript
import { supabase } from '@/integrations/supabase/client';

// Récupérer le sitemap
const { data, error } = await supabase.functions.invoke('generate-sitemap');

// Force régénération
const { data, error } = await supabase.functions.invoke('generate-sitemap', {
  body: { source: 'manual' }
});
```

### Depuis le Code Backend
```typescript
// Edge Function qui appelle generate-sitemap
await supabase.functions.invoke('generate-sitemap', {
  body: { source: 'scheduled' }
});
```

## 📝 Maintenance

### Nettoyer les Vieux Logs (Optionnel)
```sql
-- Garder seulement les 1000 derniers logs
DELETE FROM sitemap_generation_log
WHERE id NOT IN (
  SELECT id FROM sitemap_generation_log
  ORDER BY generated_at DESC
  LIMIT 1000
);
```

### Statistiques
```sql
-- Statistiques par source de trigger
SELECT 
  trigger_source,
  COUNT(*) as total_generations,
  AVG(generation_time_ms) as avg_time_ms,
  MAX(entry_count) as max_entries,
  MIN(entry_count) as min_entries
FROM sitemap_generation_log
WHERE generated_at > now() - interval '7 days'
GROUP BY trigger_source
ORDER BY total_generations DESC;
```

## ⚠️ Limites & Considérations

### Rate Limiting
- **Automatique:** 1 génération max / 5 minutes
- **Manuel:** Illimité (mais consomme des ressources)

### Performance
- Génération moyenne: **1-2 secondes**
- Maximum testé: **10,000+ URLs** (toujours < 5s)

### Cache
- Durée: **5 minutes**
- Taille maximale: Illimitée (mais recommandé < 50MB)

### SEO
- Google crawle: 1 fois / jour minimum
- Ping automatique: Non implémenté (Google découvre via robots.txt)

## 🎓 Best Practices

1. **Ne pas appeler manuellement trop souvent**
   - Les triggers automatiques suffisent
   - Google ne crawle pas le sitemap en temps réel

2. **Surveiller les logs**
   - Vérifier que les générations sont rapides (< 3s)
   - S'assurer qu'il n'y a pas trop de régénérations

3. **Mettre à jour robots.txt**
   - Toujours pointer vers le sitemap
   - `Sitemap: https://vente.club/sitemap.xml`

4. **Soumettre à Google Search Console**
   - Soumettre l'URL de l'Edge Function
   - Vérifier les erreurs d'indexation

## 🔗 Intégrations

### Google Search Console
```
1. Aller dans Search Console
2. Sitemaps
3. Ajouter: https://xmwsrvaricrfxovimffm.supabase.co/functions/v1/generate-sitemap
4. Soumettre
```

### Robots.txt
```
Sitemap: https://xmwsrvaricrfxovimffm.supabase.co/functions/v1/generate-sitemap
```

## 📚 Ressources

- [Sitemap Protocol](https://www.sitemaps.org/protocol.html)
- [Google Sitemap Guidelines](https://developers.google.com/search/docs/advanced/sitemaps/build-sitemap)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Dernière mise à jour:** 13 janvier 2025  
**Status:** ✅ Production Ready  
**Version:** 1.0.0
