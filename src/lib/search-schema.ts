import { z } from "zod";

/**
 * Schema Zod pour la validation du formulaire de recherche
 * Tous les champs sont des strings (vides par défaut)
 */
export const searchFormSchema = z.object({
  query: z.string().trim(),
  colors: z.string().trim(),
  type: z.string().trim(),
  rarity: z.string().trim(),
  set: z
    .string()
    .trim()
    .transform((val) => val.toUpperCase()),
  language: z.string().trim(),
});

export type SearchFormValues = z.infer<typeof searchFormSchema>;

/**
 * Convertit les paramètres d'URL en valeurs de formulaire validées
 */
export function parseSearchParams(
  searchParams: URLSearchParams
): SearchFormValues {
  return searchFormSchema.parse({
    query: searchParams.get("q") || "",
    colors: searchParams.get("colors") || "",
    type: searchParams.get("type") || "",
    rarity: searchParams.get("rarity") || "",
    set: searchParams.get("set") || "",
    language: searchParams.get("lang") || "",
  });
}

/**
 * Convertit les valeurs du formulaire en paramètres d'URL
 */
export function buildSearchParams(values: SearchFormValues): URLSearchParams {
  const params = new URLSearchParams();

  if (values.query) params.set("q", values.query);
  if (values.colors) params.set("colors", values.colors);
  if (values.type) params.set("type", values.type);
  if (values.rarity) params.set("rarity", values.rarity);
  if (values.set) params.set("set", values.set);
  if (values.language) params.set("lang", values.language);

  return params;
}

/**
 * Vérifie si le formulaire a des valeurs à rechercher
 */
export function hasSearchValues(values: SearchFormValues): boolean {
  return !!(
    values.query ||
    values.colors ||
    values.type ||
    values.rarity ||
    values.set ||
    values.language
  );
}

/**
 * Vérifie si le formulaire a des critères de recherche réels (sans la langue seule)
 * Utilisé pour décider si on lance une recherche au montage
 */
export function hasRealSearchCriteria(values: SearchFormValues): boolean {
  return !!(
    values.query ||
    values.colors ||
    values.type ||
    values.rarity ||
    values.set
  );
}
