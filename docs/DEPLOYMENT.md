# Guide de déploiement sur Vercel

## Prérequis

1. Un compte Vercel (gratuit) : https://vercel.com/signup
2. Une base de données PostgreSQL en ligne (gratuite)
3. Votre code Git pushé sur GitHub/GitLab/Bitbucket

## Étape 1 : Préparer la base de données (gratuite)

### Option A : Neon (Recommandé - Gratuit)

1. Créer un compte sur https:// neon.tech
2. Créer un nouveau projet
3. Copier la connection string PostgreSQL
4. Format : `postgresql://username:password@host/database?sslmode=require`

### Option B : Supabase (Gratuit)

1. Créer un compte sur https://supabase.com
2. Créer un nouveau projet
3. Aller dans Settings > Database
4. Copier la "Connection string" (mode "URI")

### Option C : Railway (Gratuit)

1. Créer un compte sur https://railway.app
2. Créer un nouveau projet PostgreSQL
3. Copier la DATABASE_URL depuis les variables

## Étape 2 : Déployer sur Vercel

### A. Via l'interface web Vercel

1. **Connecter votre repository**

   - Allez sur https://vercel.com/new
   - Importez votre repository GitHub
   - Sélectionnez le projet magicstack

2. **Configurer le projet**

   - Framework Preset : Next.js (détecté automatiquement)
   - Root Directory : `./` (ou le dossier si différent)
   - Build Command : `prisma generate && next build`
   - Install Command : `npm install`

3. **Ajouter les variables d'environnement**
   Dans les "Environment Variables", ajoutez :

   ```
   DATABASE_URL=postgresql://username:password@host/database?sslmode=require
   NEXTAUTH_URL=https://votre-app.vercel.app
   NEXTAUTH_SECRET=générez-une-clé-secrète-unique
   ```

   **Pour générer NEXTAUTH_SECRET**, exécutez localement :

   ```bash
   openssl rand -base64 32
   ```

   **OAuth (Optionnel)** - Si vous voulez GitHub/Google :

   ```
   GITHUB_CLIENT_ID=votre-client-id
   GITHUB_CLIENT_SECRET=votre-client-secret
   GOOGLE_CLIENT_ID=votre-client-id
   GOOGLE_CLIENT_SECRET=votre-client-secret
   ```

4. **Déployer**
   - Cliquez sur "Deploy"
   - Attendez la fin du build (2-3 minutes)

### B. Via la CLI Vercel (Alternative)

```bash
# Installer la CLI Vercel
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Suivre les instructions
# Lors de la première fois, configurez les variables d'environnement
```

## Étape 3 : Initialiser la base de données

Après le premier déploiement, vous devez appliquer le schéma Prisma :

### Option 1 : Via la CLI locale

```bash
# Définir temporairement la DATABASE_URL de production
export DATABASE_URL="postgresql://username:password@host/database"

# Pousser le schéma
npx prisma db push

# Ou migrer
npx prisma migrate deploy
```

### Option 2 : Via Prisma Studio

```bash
# Se connecter à la DB de production
npx prisma studio --browser none
```

## Étape 4 : Configurer les OAuth (Optionnel)

### GitHub OAuth

1. Allez sur https://github.com/settings/developers
2. Créez une "New OAuth App"
3. Homepage URL : `https://votre-app.vercel.app`
4. Authorization callback URL : `https://votre-app.vercel.app/api/auth/callback/github`
5. Copiez Client ID et générez un Client Secret
6. Ajoutez-les dans les variables Vercel

### Google OAuth

1. Allez sur https://console.cloud.google.com
2. Créez un nouveau projet
3. Activez "Google+ API"
4. Credentials > Create Credentials > OAuth 2.0 Client ID
5. Authorized redirect URIs : `https://votre-app.vercel.app/api/auth/callback/google`
6. Copiez Client ID et Client Secret
7. Ajoutez-les dans les variables Vercel

## Étape 5 : Redéployer avec les variables

Après avoir ajouté toutes les variables :

1. Allez dans "Deployments"
2. Cliquez sur les 3 points du dernier déploiement
3. "Redeploy"
4. Ou faites un nouveau commit/push

## Vérifications

✅ Le site est accessible
✅ La connexion/inscription fonctionne
✅ Les collections peuvent être créées
✅ La recherche de cartes fonctionne
✅ Les decks peuvent être créés et modifiés

## Dépannage

### Erreur : "prisma:error Error in Prisma Client"

- Vérifiez que DATABASE_URL est correctement configuré
- Assurez-vous que `prisma generate` est dans le build command

### Erreur : "NextAuth configuration error"

- Vérifiez NEXTAUTH_URL (doit être l'URL Vercel)
- Vérifiez NEXTAUTH_SECRET (doit être défini)

### Erreur 500 sur les routes API

- Vérifiez les logs dans Vercel Dashboard > Deployment > Functions
- Vérifiez la connexion à la base de données

## Commandes utiles

```bash
# Voir les logs en temps réel
vercel logs

# Voir les variables d'environnement
vercel env ls

# Ajouter une variable
vercel env add DATABASE_URL

# Déployer en production
vercel --prod
```

## Maintenance

- Les déploiements sont automatiques à chaque push sur main
- Vercel crée des preview pour chaque PR
- Surveillez les logs dans le dashboard Vercel
- Base de données : pensez à faire des backups réguliers

## Coûts

- Vercel : Gratuit pour les projets personnels
- Neon/Supabase : Gratuit avec limitations (suffisant pour débuter)
- Pas de carte bancaire requise pour commencer
