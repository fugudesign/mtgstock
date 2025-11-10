import crypto from "crypto";

/**
 * Génère une URL Gravatar basée sur un email
 * @param email - L'email de l'utilisateur
 * @param size - La taille de l'avatar (défaut: 80)
 * @returns L'URL de l'avatar Gravatar
 */
export function getGravatarUrl(email: string, size = 80): string {
  const hash = crypto
    .createHash("md5")
    .update(email.trim().toLowerCase())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

/**
 * Retourne l'URL de l'avatar (custom ou Gravatar)
 * @param image - L'URL custom de l'image (peut être null)
 * @param email - L'email de l'utilisateur
 * @param size - La taille de l'avatar
 * @returns L'URL de l'avatar à utiliser
 */
export function getAvatarUrl(
  image: string | null | undefined,
  email: string,
  size = 80
): string {
  return image || getGravatarUrl(email, size);
}
