# Configuration de la protection anti-bots

Ce projet implémente plusieurs couches de protection contre les bots pour les inscriptions :

## 1. Protection Honeypot (Déjà actif)

Un champ invisible piège les bots qui remplissent automatiquement tous les champs.

## 2. Rate Limiting (Déjà actif)

Limite les inscriptions à **3 par heure par adresse IP**.

## 3. Protection temporelle (Déjà actif)

Le formulaire doit être rempli en au moins **3 secondes** pour détecter les soumissions automatiques trop rapides.

## 4. Google reCAPTCHA v3 (Optionnel)

Pour activer reCAPTCHA v3, suivez ces étapes :

### Étape 1 : Obtenir vos clés reCAPTCHA

1. Allez sur [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Cliquez sur "+" pour créer un nouveau site
3. Remplissez le formulaire :
   - **Label** : Magic Stack (ou le nom de votre choix)
   - **Type de reCAPTCHA** : Sélectionnez "Score based (v3)"
   - **Domaines** : Ajoutez vos domaines (ex: `localhost` pour le dev, `votresite.com` pour la prod)
4. Acceptez les conditions et cliquez sur "Envoyer"
5. Vous obtiendrez deux clés :
   - **Clé de site** (Site Key) : publique, utilisée côté client
   - **Clé secrète** (Secret Key) : privée, utilisée côté serveur

### Étape 2 : Configurer les variables d'environnement

Ajoutez ces lignes à votre fichier `.env.local` :

```bash
# Google reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="votre-site-key-ici"
RECAPTCHA_SECRET_KEY="votre-secret-key-ici"
```

⚠️ **Important** : Ne commitez JAMAIS le fichier `.env.local` dans Git !

### Étape 3 : Configuration pour la production (Vercel)

Dans votre dashboard Vercel :

1. Allez dans **Settings** → **Environment Variables**
2. Ajoutez les deux variables :
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - `RECAPTCHA_SECRET_KEY`
3. Redéployez l'application

## Comment ça fonctionne ?

### Sans reCAPTCHA configuré

- Le formulaire fonctionne normalement
- Les protections Honeypot, Rate Limiting et temporelle sont actives
- Pas de badge reCAPTCHA visible

### Avec reCAPTCHA configuré

- Un badge reCAPTCHA discret apparaît en bas à droite de la page
- À chaque soumission, un score de 0.0 à 1.0 est calculé :
  - **1.0** = très probablement humain ✅
  - **0.5-0.9** = probablement humain ✅
  - **0.0-0.4** = probablement bot ❌
- Le seuil actuel est de **0.5** (configurable dans `/api/auth/register/route.ts`)
- L'expérience utilisateur reste fluide (pas de CAPTCHA à résoudre)

## Personnalisation

### Changer le seuil reCAPTCHA

Dans `src/app/api/auth/register/route.ts`, ligne ~80 :

```typescript
if (data.success && data.score >= 0.5) {
  // Changez 0.5 selon vos besoins
  return true;
}
```

### Ajuster le rate limiting

Dans `src/app/api/auth/register/route.ts`, lignes 8-9 :

```typescript
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 heure en millisecondes
const MAX_REQUESTS_PER_WINDOW = 3; // Nombre maximum d'inscriptions
```

### Modifier le délai minimum

Dans `src/app/auth/register/page.tsx`, ligne ~61 :

```typescript
if (timeTaken < 3000) { // 3000 ms = 3 secondes
```

## Test de la protection

### Test Honeypot

Ouvrez la console développeur et exécutez :

```javascript
document.getElementById("website").value = "test";
```

Puis soumettez le formulaire → devrait être bloqué.

### Test Rate Limiting

Créez 4 comptes rapidement → le 4ème devrait être bloqué avec un message de délai.

### Test reCAPTCHA

Utilisez un bot automatisé ou un script pour soumettre le formulaire → devrait être bloqué si le score est < 0.5.

## Monitoring

Les tentatives de bot sont loggées dans la console serveur :

- `Bot detected via honeypot` : Honeypot déclenché
- `Bot detected: form submitted too quickly` : Soumission trop rapide
- `reCAPTCHA verification failed` : Score reCAPTCHA trop bas

## Recommandations de production

1. ✅ **Activez reCAPTCHA v3** pour une protection maximale
2. ✅ Utilisez **Redis** ou une base de données pour le rate limiting (au lieu de la mémoire)
3. ✅ Ajoutez des **logs de sécurité** détaillés
4. ✅ Surveillez les **métriques reCAPTCHA** dans le dashboard Google
5. ✅ Considérez ajouter une **confirmation par email** après inscription

## Support

En cas de problème :

- Vérifiez que vos domaines sont bien ajoutés dans la console reCAPTCHA
- Consultez les logs serveur pour les erreurs de vérification
- Testez avec `localhost` en développement

---

**Note** : reCAPTCHA v3 est invisible et n'interrompt jamais l'expérience utilisateur, contrairement à v2 qui affiche des challenges.
