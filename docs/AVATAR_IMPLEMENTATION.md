# 🖼️ Système d'Avatar - Résumé

## ✨ Fonctionnalités

Le système d'avatar supporte 3 méthodes au choix :

1. **Gravatar (par défaut)**

   - Avatar généré automatiquement depuis l'email
   - Aucune configuration requise
   - Modifiable sur [gravatar.com](https://gravatar.com)

2. **Upload direct**

   - Stockage sur Vercel Blob Storage
   - JPG, PNG, WebP, GIF supportés
   - Max 5MB par fichier
   - Suppression automatique de l'ancien avatar

3. **URL externe** (via API)
   - Compatibilité avec OAuth providers (GitHub, Google)
   - Validation d'URL côté serveur

## 📦 Fichiers ajoutés/modifiés

### Nouveaux fichiers

- `/src/lib/avatar.ts` - Helpers pour Gravatar et gestion d'avatar
- `/src/app/api/user/avatar/route.ts` - API upload/delete
- `/docs/AVATAR_SETUP.md` - Documentation complète

### Fichiers modifiés

- `/src/components/profile/ProfileForm.tsx` - UI upload avec boutons
- `/src/app/api/user/profile/route.ts` - Support du champ `image`
- `/src/components/UserMenu.tsx` - Utilisation de `getAvatarUrl()`
- `/src/app/profile/page.tsx` - Passage du champ `image`
- `/docs/DEPLOYMENT.md` - Ajout de la configuration Blob Storage
- `.env.example` - Documentation du token Blob

### Dépendances

- `@vercel/blob@2.0.0` - Gestion du stockage d'images

## 🚀 Configuration

### Développement local (optionnel)

```bash
# 1. Créer un Blob Storage sur Vercel
# Dashboard → Storage → Create Database → Blob

# 2. Copier le token dans .env.local
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxx"
```

**Sans token** : Gravatar sera utilisé par défaut (upload ne fonctionnera pas).

### Production (Vercel)

```bash
# 1. Dans le dashboard Vercel de votre projet
# Storage → Create Database → Blob

# 2. Le token sera automatiquement ajouté
# Aucune configuration manuelle requise !
```

## 💰 Coûts

**Plan gratuit Vercel Blob** :

- ✅ 1GB de stockage total
- ✅ 1GB de bande passante par mois
- ✅ Largement suffisant pour des avatars !

**Calcul** :

- 1000 avatars à 500KB = 500MB stockage
- 10 000 vues/mois = ~500MB bande passante
- **Reste dans le plan gratuit** 🎉

## 🔧 Utilisation

### Dans le code

```tsx
import { getAvatarUrl } from "@/lib/avatar";

// Composant Avatar
<Avatar>
  <AvatarImage
    src={getAvatarUrl(user.image, user.email, 160)}
    alt={user.name || "User"}
  />
  <AvatarFallback>
    <User className="size-4" />
  </AvatarFallback>
</Avatar>;
```

### API Routes

```typescript
// Upload
POST /api/user/avatar
Body: FormData { avatar: File }

// Delete
DELETE /api/user/avatar
```

## 📝 Notes importantes

1. **Sécurité**

   - Upload limité à 5MB
   - Types MIME validés (JPG, PNG, WebP, GIF)
   - Authentification requise
   - URLs publiques mais non listables

2. **Performance**

   - Suppression automatique de l'ancien avatar
   - CDN Vercel pour la distribution
   - Fallback Gravatar en cas d'erreur

3. **Compatibilité**
   - Fonctionne sur tous les plans Vercel (Hobby inclus)
   - Compatible avec Neon PostgreSQL
   - Aucune migration de base requise (champ `image` déjà existant)

## 📚 Documentation

- [Setup complet](./AVATAR_SETUP.md)
- [Configuration Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- [Déploiement](./DEPLOYMENT.md)

## ✅ Migration

Aucune migration nécessaire ! Le champ `User.image` existait déjà dans le schéma Prisma. Le système est **rétrocompatible** :

- Les utilisateurs existants auront Gravatar par défaut
- Les avatars OAuth (GitHub, Google) sont préservés
- Aucune perte de données
