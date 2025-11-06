# 🔬 Guide de Test de Sécurité - Vente.club

## Instructions pour valider la conformité PCI DSS

Ce document vous guide pas à pas pour tester et valider toutes les mesures de sécurité mises en place sur vente.club.

---

## 🎯 Tests à Effectuer

### 1. Test SSL/TLS (Score A+ requis)

#### Via SSL Labs (Recommandé)

**URL de test :**
```
https://www.ssllabs.com/ssltest/analyze.html?d=vente.club
```

**Ce qui doit être vérifié :**
- ✅ **Grade global : A+**
- ✅ Certificate : Valid (pas d'erreur)
- ✅ Protocol Support : TLS 1.3 uniquement (TLS 1.2 acceptable mais désactivé si possible)
- ✅ Key Exchange : 2048 bits minimum (4096 bits recommandé)
- ✅ Cipher Strength : Fort (AES-256-GCM recommandé)
- ✅ HSTS : Oui (max-age ≥ 31536000 secondes)
- ✅ HSTS Preload : Oui
- ✅ HSTS includeSubDomains : Oui
- ✅ Forward Secrecy : Oui (tous les ciphers)

**Capture d'écran à faire :**
- Screenshot du grade final (A+)
- Screenshot de la section "Protocol Details"
- Screenshot de la section "HSTS"

**Interprétation des résultats :**
| Grade | Signification | Action |
|-------|---------------|--------|
| A+ | Excellent - Conforme PCI DSS | ✅ Aucune action |
| A | Bon - Conforme mais améliorable | ⚠️ Activer HSTS Preload |
| B | Moyen - Non conforme | ❌ Corriger les vulnérabilités |
| C ou moins | Critique - À corriger immédiatement | 🚨 Mise à jour urgente |

---

### 2. Test des Headers de Sécurité

#### Via Security Headers

**URL de test :**
```
https://securityheaders.com/?q=vente.club&followRedirects=on
```

**Headers requis (tous doivent être présents) :**

| Header | Valeur attendue | Score |
|--------|----------------|-------|
| Content-Security-Policy | default-src 'self'; script-src ... | A |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | A |
| X-Frame-Options | DENY | A |
| X-Content-Type-Options | nosniff | A |
| Referrer-Policy | strict-origin-when-cross-origin | A |
| Permissions-Policy | geolocation=(self), payment=... | A |

**Score attendu : A (grade global)**

**Capture d'écran à faire :**
- Screenshot du grade final (A)
- Screenshot de tous les headers détectés en vert

**Comment corriger un header manquant :**
Si un header est en rouge/orange, vérifier dans `index.html` :
```html
<meta http-equiv="[NOM_HEADER]" content="[VALEUR]" />
```

---

### 3. Test Mozilla Observatory

**URL de test :**
```
https://observatory.mozilla.org/analyze/vente.club
```

**Score attendu : A+ (90-100 points)**

**Tests effectués :**
- ✅ Content Security Policy
- ✅ Cookies (Secure, HttpOnly, SameSite)
- ✅ Cross-origin Resource Sharing
- ✅ HTTP Public Key Pinning (optionnel)
- ✅ HTTP Strict Transport Security
- ✅ Redirection (HTTP → HTTPS)
- ✅ Referrer Policy
- ✅ Subresource Integrity (SRI)
- ✅ X-Content-Type-Options
- ✅ X-Frame-Options
- ✅ X-XSS-Protection

**Capture d'écran à faire :**
- Screenshot du score global
- Screenshot de chaque test en vert

---

### 4. Vérification Stripe (PCI DSS)

#### Tester l'intégration Stripe Checkout

**Étapes :**

1. **Aller sur la page de paiement de vente.club**
   - Par exemple : page d'abonnement Premium

2. **Cliquer sur "S'abonner" ou "Payer"**
   - Vérifier la redirection vers `checkout.stripe.com`

3. **Inspecter l'URL**
   - URL doit ressembler à : `https://checkout.stripe.com/c/pay/cs_test_...`
   - **Preuve que les paiements passent par Stripe, pas par vos serveurs**

4. **Tester avec une carte de test**
   ```
   Numéro : 4242 4242 4242 4242
   Expiration : n'importe quelle date future
   CVC : n'importe quel 3 chiffres
   ```

5. **Vérifier les headers de sécurité sur checkout.stripe.com**
   - Ouvrir DevTools → Network → Headers
   - Confirmer HTTPS et headers de sécurité Stripe

**Capture d'écran à faire :**
- Screenshot de la page Stripe Checkout (logo cadenas HTTPS)
- Screenshot de l'URL `checkout.stripe.com`
- Screenshot du succès de paiement

**Certificat PCI DSS de Stripe :**
- Télécharger depuis : https://stripe.com/docs/security/stripe
- AOC (Attestation of Compliance) disponible ici : https://payments.stripe.com/PCI_DSS_AOC_2023.pdf

---

### 5. Scan de Vulnérabilités (OWASP ZAP)

#### Installation de OWASP ZAP (gratuit)

```bash
# Télécharger depuis https://www.zaproxy.org/download/

# Ou via Docker
docker pull zaproxy/zap-stable
```

#### Lancer un scan automatique

```bash
# Scan de base (5-10 minutes)
zap-baseline.py -t https://vente.club -r rapport-scan.html

# Scan complet (30-60 minutes)
zap-full-scan.py -t https://vente.club -r rapport-complet.html
```

**Ce qui doit être vérifié :**
- ✅ Aucune alerte **High** (critique)
- ✅ Aucune alerte **Medium** (moyenne) pour SQL Injection, XSS, CSRF
- ⚠️ Alertes **Low** (faible) acceptables mais à documenter
- ℹ️ Alertes **Informational** peuvent être ignorées

**Vulnérabilités critiques à surveiller :**
- 🚨 SQL Injection
- 🚨 Cross-Site Scripting (XSS)
- 🚨 Cross-Site Request Forgery (CSRF)
- 🚨 Broken Authentication
- 🚨 Sensitive Data Exposure
- 🚨 XML External Entities (XXE)
- 🚨 Broken Access Control
- 🚨 Security Misconfiguration
- 🚨 Insecure Deserialization
- 🚨 Using Components with Known Vulnerabilities

**Capture d'écran à faire :**
- Screenshot du rapport HTML généré
- Screenshot de la section "Alerts Summary"
- Si des alertes High/Medium : screenshot de chaque alerte + justification

---

### 6. Test de la Protection Anti-Attaques

#### Test Rate Limiting (Protection Brute Force)

**Étapes :**

1. Aller sur `/auth` (page de connexion)
2. Entrer un email valide et un mauvais mot de passe
3. Répéter 3 fois rapidement
4. **Résultat attendu :** Compte bloqué pendant 15 minutes + message d'erreur

**Capture d'écran à faire :**
- Screenshot du message de blocage
- Screenshot du dashboard admin `/admin/security` montrant l'IP bloquée

#### Test reCAPTCHA

**Étapes :**

1. Aller sur `/auth` (page de connexion)
2. **Vérifier la présence du badge reCAPTCHA** (coin inférieur droit)
3. Essayer de se connecter
4. **Résultat attendu :** Challenge reCAPTCHA si comportement suspect

**Capture d'écran à faire :**
- Screenshot du badge "Protected by reCAPTCHA"
- Screenshot du challenge (si déclenché)

#### Test Détection Multi-comptes

**Étapes :**

1. Se connecter depuis un navigateur
2. Ouvrir un mode incognito
3. Créer un nouveau compte avec une autre adresse email
4. Vérifier dans `/admin/security` → Empreintes

**Résultat attendu :**
- Même empreinte digitale détectée
- Alerte "Suspect" dans le dashboard admin

**Capture d'écran à faire :**
- Screenshot de la section "Empreintes" avec les 2 comptes

---

### 7. Test de l'Audit Log

#### Vérifier le logging des événements de sécurité

**Étapes :**

1. Se connecter au dashboard admin
2. Aller sur `/admin/compliance`
3. Vérifier que les métriques s'affichent :
   - Nombre d'events d'audit tracés
   - IPs bloquées
   - Tentatives échouées

4. Dans la base de données, vérifier la table `security_audit_log` :
   ```sql
   SELECT * FROM security_audit_log 
   ORDER BY created_at DESC 
   LIMIT 20;
   ```

**Événements qui doivent être loggés :**
- ✅ Connexion réussie
- ✅ Échec de connexion
- ✅ Déverrouillage de contact vendeur
- ✅ Modification de paramètres de sécurité
- ✅ Suppression de compte
- ✅ Changement de mot de passe

**Capture d'écran à faire :**
- Screenshot de la page `/admin/compliance` avec les métriques
- Screenshot d'une requête SQL sur `security_audit_log`

---

### 8. Test de Masquage des Données Sensibles (PII)

#### Vérifier que les données vendeurs sont masquées

**Étapes :**

1. **Sans être connecté**, aller sur une page entreprise
   - Exemple : `/entreprise/[slug]`

2. Vérifier que le téléphone et email du vendeur **ne sont PAS visibles**

3. Ouvrir DevTools → Network → XHR
4. Inspecter la réponse de l'API (requête GET businesses)
5. **Vérifier que `seller_phone`, `seller_name`, `seller_email` sont NULL**

6. Se connecter et déverrouiller l'accès
7. **Maintenant** le téléphone/email doit être visible

**Capture d'écran à faire :**
- Screenshot de la page sans connexion (données masquées)
- Screenshot de la réponse API (Network tab) avec les champs NULL
- Screenshot après déverrouillage (données visibles)

---

## 📊 Rapport Final de Conformité

### Template de rapport à compléter

```markdown
# Rapport de Test de Sécurité - Vente.club
**Date :** [DATE]
**Testeur :** [NOM]
**Environnement :** Production

## Résultats des Tests

### 1. SSL/TLS (SSL Labs)
- **Score :** A+ ✅
- **TLS Version :** 1.3 ✅
- **HSTS :** Activé ✅
- **Capture :** [lien vers screenshot]

### 2. Security Headers
- **Score :** A ✅
- **Headers manquants :** Aucun ✅
- **Capture :** [lien vers screenshot]

### 3. Mozilla Observatory
- **Score :** 95/100 (A+) ✅
- **Tests échoués :** Aucun ✅
- **Capture :** [lien vers screenshot]

### 4. Stripe Checkout
- **Redirection vers Stripe :** ✅
- **Paiement test réussi :** ✅
- **Certificat PCI DSS vérifié :** ✅
- **Capture :** [lien vers screenshot]

### 5. Scan OWASP ZAP
- **Alertes High :** 0 ✅
- **Alertes Medium :** 0 ✅
- **Alertes Low :** 2 (documentées) ⚠️
- **Capture :** [lien vers rapport HTML]

### 6. Protection Anti-Attaques
- **Rate Limiting :** Fonctionne ✅
- **reCAPTCHA :** Actif ✅
- **Détection multi-comptes :** Fonctionne ✅
- **Capture :** [lien vers screenshots]

### 7. Audit Log
- **Événements tracés :** 15,234 ✅
- **Rétention :** 90 jours ✅
- **Capture :** [lien vers screenshot]

### 8. Masquage PII
- **Données masquées (public) :** ✅
- **Données visibles (après paiement) :** ✅
- **Capture :** [lien vers screenshots]

## Conclusion

✅ **CONFORMITÉ PCI DSS LEVEL 1 VALIDÉE**

Toutes les exigences sont respectées. Le site vente.club est sécurisé et conforme pour le traitement des paiements en ligne.

**Recommandations :**
- Renouveler les tests trimestriellement
- Monitorer le dashboard `/admin/security` quotidiennement
- Mettre à jour les certificats SSL avant expiration

**Prochaine revue :** [DATE + 3 MOIS]

---

Signature : ___________________
Date : ___________________
```

---

## 🔧 Dépannage

### Problème : Score SSL Labs < A

**Solutions :**
1. Vérifier que TLS 1.0/1.1/1.2 sont désactivés
2. Activer HSTS avec preload
3. Renouveler le certificat SSL (obtenir EV/OV si possible)
4. Contacter le support Lovable/Cloudflare

### Problème : Headers de sécurité manquants

**Solutions :**
1. Vérifier `index.html` lignes 7-13
2. S'assurer que le CDN ne supprime pas les headers
3. Tester en local d'abord
4. Vérifier les redirections (301 vs 302)

### Problème : Scan OWASP ZAP montre des alertes High

**Solutions :**
1. Lire en détail chaque alerte (ne pas paniquer)
2. Vérifier si c'est un faux positif (commun avec ZAP)
3. Corriger les vraies vulnérabilités immédiatement
4. Relancer le scan après correction

### Problème : reCAPTCHA ne s'affiche pas

**Solutions :**
1. Vérifier que la clé du site est correcte dans `Auth.tsx`
2. Vérifier que le domaine est autorisé dans Google reCAPTCHA Admin
3. Tester en mode incognito (extensions navigateur peuvent bloquer)
4. Vérifier la console pour erreurs JS

---

## 📞 Support Sécurité

**En cas de découverte de vulnérabilité :**
- Email : security@vente.club
- Réponse sous 24h (48h max)
- Bug Bounty disponible pour vulnérabilités critiques

**Ressources supplémentaires :**
- [Documentation PCI DSS](https://www.pcisecuritystandards.org/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Stripe Security](https://stripe.com/docs/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)

---

*Document maintenu par l'équipe sécurité de Vente.club*  
*Dernière mise à jour : 2025-01-06*