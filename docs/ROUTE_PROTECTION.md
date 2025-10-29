# Protection des routes par authentification

## Routes protégées

Les pages suivantes nécessitent maintenant une authentification pour être accessibles :

### 🔒 Routes protégées :

- **`/search`** - Recherche de cartes
- **`/search/*`** - Tous les chemins de recherche
- **`/cards`** - Liste de cartes
- **`/cards/:id`** - Détails d'une carte
- **`/collections`** - Liste des collections
- **`/collections/:id`** - Détails d'une collection
- **`/decks`** - Liste des decks
- **`/decks/:id`** - Détails d'un deck
- **`/profile`** - Page de profil utilisateur

### 🔓 Routes publiques :

- **`/`** - Page d'accueil
- **`/auth/login`** - Page de connexion
- **`/auth/register`** - Page d'inscription

## Comment ça fonctionne ?

### Middleware Next.js

Le fichier `src/middleware.ts` intercepte toutes les requêtes vers les routes protégées et vérifie si l'utilisateur est authentifié via NextAuth.

**Si l'utilisateur n'est PAS connecté :**

1. Il est redirigé vers `/auth/login`
2. L'URL de destination est sauvegardée dans `callbackUrl`
3. Après connexion, il est automatiquement redirigé vers la page qu'il voulait visiter

**Si l'utilisateur est connecté :**

- Il accède normalement à la page demandée

### Expérience utilisateur

#### Page d'accueil

- **Non connecté** : Affiche des boutons "Se connecter" et "Créer un compte"
- **Connecté** : Affiche des boutons "Rechercher des cartes" et "Mes collections"
- Bannière d'information pour les utilisateurs non connectés

#### Page de connexion

- Message automatique si redirigé : "Vous devez être connecté pour accéder à cette page"
- Redirection automatique après connexion vers la page demandée

#### Navigation

- Les liens restent visibles pour tous
- Clic sur un lien protégé → redirection automatique vers login

## Avantages de cette approche

✅ **Sécurité côté serveur** : Protection au niveau du middleware (impossible de contourner)
✅ **Expérience fluide** : L'utilisateur revient automatiquement à sa page après connexion
✅ **Messages clairs** : L'utilisateur sait pourquoi il doit se connecter
✅ **Centralisé** : Une seule configuration dans `middleware.ts` pour toute l'application

## Personnalisation

### Ajouter une route protégée

Dans `src/middleware.ts`, ajoutez le chemin dans `matcher` :

```typescript
export const config = {
  matcher: [
    "/search/:path*",
    "/cards/:path*",
    "/collections/:path*",
    "/decks/:path*",
    "/profile/:path*",
    "/nouvelle-route/:path*", // ← Nouvelle route
  ],
};
```

### Exclure une route de la protection

Retirez simplement le chemin du `matcher` dans `middleware.ts`.

### Changer la page de redirection

Pour rediriger vers une autre page que `/auth/login`, modifiez cette ligne dans `middleware.ts` :

```typescript
const url = new URL("/auth/login", request.url); // ← Changer ici
```

## Test

### Tester la protection

1. Déconnectez-vous
2. Essayez d'accéder à `/search` → Vous devriez être redirigé vers login
3. Connectez-vous → Vous êtes redirigé vers `/search`

### Tester la page d'accueil

1. Déconnecté → Boutons "Se connecter" et "Créer un compte" + bannière d'info
2. Connecté → Boutons "Rechercher" et "Collections" + pas de bannière

## Notes techniques

- **NextAuth v5** : Utilise `getToken()` du package `next-auth/jwt`
- **Middleware Edge** : Exécuté avant chaque requête (très performant)
- **Pattern matching** : Le `:path*` protège toutes les sous-routes
- **URL preservation** : Le `callbackUrl` contient l'URL complète avec les paramètres

---

**Sécurité** : Ces routes sont protégées au niveau du serveur, pas seulement côté client. Même avec JavaScript désactivé, l'accès est bloqué.
