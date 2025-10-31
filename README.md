# Magic Stack

Une application moderne de gestion de collections et decks Magic: The Gathering, construite avec Next.js, TypeScript et Tailwind CSS.

## 🚀 Fonctionnalités

- **Recherche avancée** : Parcourez plus de 30 000 cartes Magic avec des filtres puissants
- **Collections personnelles** : Organisez vos cartes par collection avec suivi des quantités et états
- **Gestion de decks** : Créez et gérez vos decks avec mainboard/sideboard
- **Support multilingue** : Recherche en français et autres langues
- **Interface moderne** : Design responsive avec Tailwind CSS
- **Authentification** : Connexion via GitHub ou Google

## 🛠️ Stack technique

- **Frontend** : Next.js 15, React 18, TypeScript
- **Styling** : Tailwind CSS
- **Base de données** : Prisma ORM (compatible PostgreSQL/MySQL)
- **Authentification** : NextAuth.js v5
- **API externe** : Magic: The Gathering API
- **Déploiement** : Vercel

## 📦 Installation rapide

### 1. Cloner le projet

```bash
git clone <your-repo-url>
cd magicstack
npm install
```

### 2. Configuration base de données

#### Option A: Utiliser Neon (PostgreSQL - Recommandé)

1. Créer un compte sur [Neon](https://neon.tech)
2. Créer une nouvelle base de données
3. Copier l'URL de connexion
4. Dans `.env`, remplacer `DATABASE_URL` par votre URL Neon

#### Option B: Utiliser PlanetScale (MySQL)

1. Créer un compte sur [PlanetScale](https://planetscale.com)
2. Créer une nouvelle base de données
3. Obtenir l'URL de connexion
4. Modifier `prisma/schema.prisma` : changer `provider = "postgresql"` vers `provider = "mysql"`
5. Ajouter `relationMode = "prisma"` dans le bloc datasource
6. Mettre à jour `DATABASE_URL` dans `.env`

### 3. Configuration des variables d'environnement

Copier `.env.example` vers `.env` et configurer :

```bash
cp .env.example .env
```

Variables requises :

- `DATABASE_URL` : URL de votre base de données
- `NEXTAUTH_SECRET` : Clé secrète pour NextAuth (générer avec `openssl rand -base64 32`)
- `NEXTAUTH_URL` : URL de votre application (`http://localhost:3000` en dev)

Variables optionnelles (pour OAuth) :

- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`

### 4. Configuration OAuth (Optionnel)

#### GitHub OAuth

1. Aller sur GitHub Settings > Developer settings > OAuth Apps
2. Créer une nouvelle OAuth App
3. Callback URL : `http://localhost:3000/api/auth/callback/github`
4. Copier Client ID et Client Secret dans `.env`

#### Google OAuth

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Créer un nouveau projet ou sélectionner un existant
3. Activer l'API Google+
4. Créer des identifiants OAuth 2.0
5. Ajouter `http://localhost:3000/api/auth/callback/google` aux URLs autorisées
6. Copier Client ID et Client Secret dans `.env`

### 5. Initialiser la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Pousser le schéma vers la base de données
npx prisma db push
```

### 6. Lancer l'application

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

## 🚀 Déploiement sur Vercel

### 1. Déploiement automatique

1. Pusher votre code sur GitHub
2. Connecter votre repository à [Vercel](https://vercel.com)
3. Vercel détectera automatiquement Next.js

### 2. Configuration des variables d'environnement

Dans les settings Vercel, ajouter :

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (URL de production)
- Variables OAuth si utilisées

### 3. Configuration base de données production

- Neon : Créer une nouvelle branche/base pour la production
- PlanetScale : Créer une branche de production

## 📚 Structure du projet

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── page.tsx           # Page d'accueil
│   └── layout.tsx         # Layout principal
├── components/            # Composants réutilisables
│   ├── ui/               # Composants UI de base
│   └── CardDisplay.tsx   # Affichage des cartes
├── lib/                  # Utilitaires et configurations
│   ├── auth.ts           # Configuration NextAuth
│   ├── prisma.ts         # Client Prisma
│   ├── mtg-api.ts        # Service API Magic
│   └── utils.ts          # Utilitaires généraux
└── prisma/
    └── schema.prisma     # Schéma de base de données
```

## 🎯 Fonctionnalités à venir

- [ ] Page de recherche avancée
- [ ] Interface de gestion des collections
- [ ] Interface de gestion des decks
- [ ] Profil utilisateur avec préférences linguistiques
- [ ] Import/Export de decks
- [ ] Statistiques de collection
- [ ] Mode sombre

## 🐛 Débogage courant

### Erreur de connexion base de données

- Vérifier que `DATABASE_URL` est correctement configurée
- S'assurer que la base de données est accessible
- Exécuter `npx prisma db push` pour synchroniser le schéma

### Erreur NextAuth

- Vérifier que `NEXTAUTH_SECRET` est définie
- S'assurer que les URLs de callback OAuth sont correctes
- Vérifier les credentials OAuth

### Erreur API Magic

- L'API Magic a une limite de 5000 requêtes/heure
- Les erreurs de rate limiting sont gérées automatiquement
- Vérifier la connectivité internet

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

---

**Bon gaming ! 🎲✨**
