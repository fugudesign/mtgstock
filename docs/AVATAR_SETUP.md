# Configuration de l'Upload d'Avatar

## 🎯 Vue d'ensemble

Le système d'avatar supporte 3 méthodes :

1. **Gravatar** (par défaut) - Avatar généré depuis l'email
2. **Upload direct** - Stockage sur Vercel Blob Storage
3. **URL externe** - Via l'API (pour compatibilité OAuth)

## 📦 Prérequis

### Pour le développement local

1. Installer les dépendances :

```bash
pnpm install
```

2. Configuration Vercel Blob (optionnel pour dev) :
   - Créer un projet sur [Vercel](https://vercel.com)
   - Aller dans l'onglet "Storage" → "Create Database" → "Blob"
   - Copier le token `BLOB_READ_WRITE_TOKEN`
   - L'ajouter dans votre `.env.local`

**Note** : Sans token Blob en local, l'upload d'avatar ne fonctionnera pas, mais Gravatar sera utilisé par défaut.

### Pour la production (Vercel)

1. Créer un Blob Storage :

   - Dashboard Vercel → Projet → Storage → Create Database → Blob
   - Le token sera automatiquement ajouté aux variables d'environnement

2. Limites du plan gratuit :
   - **1GB** de stockage total
   - **1GB** de bande passante par mois
   - Largement suffisant pour les avatars !

## 🚀 Utilisation

### Télécharger un avatar

1. Aller sur `/profile`
2. Cliquer sur "Télécharger"
3. Sélectionner une image (JPG, PNG, WebP, GIF)
4. Max 5MB par fichier

### Supprimer un avatar

1. Cliquer sur "Supprimer" (visible si un avatar custom est présent)
2. Retour automatique à Gravatar

### Gravatar

Si aucun avatar n'est uploadé, un Gravatar est généré automatiquement depuis l'email :

- Unique pour chaque email
- Modifiable sur [gravatar.com](https://gravatar.com)
- Aucune configuration requise

## 🔧 API Routes

### `POST /api/user/avatar`

Upload d'un nouvel avatar.

**Body** : FormData avec `avatar` (File)

**Response** :

```json
{
  "message": "Avatar mis à jour",
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "image": "https://..."
  }
}
```

### `DELETE /api/user/avatar`

Suppression de l'avatar actuel.

**Response** :

```json
{
  "message": "Avatar supprimé",
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "image": null
  }
}
```

## 🎨 Helper Functions

### `getGravatarUrl(email: string, size?: number)`

Génère une URL Gravatar depuis un email.

### `getAvatarUrl(image: string | null, email: string, size?: number)`

Retourne l'URL de l'avatar (custom ou Gravatar en fallback).

**Utilisation** :

```tsx
import { getAvatarUrl } from "@/lib/avatar";

<AvatarImage
  src={getAvatarUrl(user.image, user.email, 160)}
  alt={user.name || "User"}
/>;
```

## 📝 Notes techniques

### Stockage

- Les avatars uploadés sont stockés dans `avatars/{userId}-{timestamp}.{ext}`
- Format : `/avatars/{id}-{timestamp}.jpg`
- Accès public (pas d'authentification requise pour afficher)

### Suppression automatique

Quand un nouvel avatar est uploadé, l'ancien est automatiquement supprimé pour économiser l'espace.

### Sécurité

- Validation du type MIME (JPG, PNG, WebP, GIF uniquement)
- Validation de la taille (max 5MB)
- Authentification requise pour upload/delete
- Les URLs Vercel Blob sont publiques mais non listables

## 🐛 Troubleshooting

### "Erreur lors de l'upload"

- Vérifier que `BLOB_READ_WRITE_TOKEN` est défini
- Vérifier la taille du fichier (< 5MB)
- Vérifier le format (JPG, PNG, WebP, GIF)

### L'avatar ne s'affiche pas

- Vérifier la console pour les erreurs CORS
- Vérifier que l'URL Blob est accessible publiquement
- Fallback automatique sur Gravatar en cas d'erreur

### Quota Vercel Blob dépassé

- Plan gratuit : 1GB storage + 1GB bandwidth/mois
- Surveiller l'utilisation dans le dashboard Vercel
- Nettoyer les anciens avatars si nécessaire
