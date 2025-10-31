/**
 * Mapping centralisé des langues pour Magic: The Gathering
 * Utilise les codes de langue standards et les noms complets reconnus par Scryfall
 */

export interface LanguageMapping {
  code: string;
  name: string;
  scryfallCode: string;
}

export const LANGUAGES: LanguageMapping[] = [
  { code: "en", name: "English", scryfallCode: "en" },
  { code: "fr", name: "French", scryfallCode: "fr" },
  { code: "de", name: "German", scryfallCode: "de" },
  { code: "es", name: "Spanish", scryfallCode: "es" },
  { code: "it", name: "Italian", scryfallCode: "it" },
  { code: "pt", name: "Portuguese (Brazil)", scryfallCode: "pt" },
  { code: "ja", name: "Japanese", scryfallCode: "ja" },
  { code: "ko", name: "Korean", scryfallCode: "ko" },
  { code: "ru", name: "Russian", scryfallCode: "ru" },
  { code: "zh", name: "Chinese Simplified", scryfallCode: "zhs" },
  { code: "zht", name: "Chinese Traditional", scryfallCode: "zht" },
];

/**
 * Convertit un code de langue (ex: "fr") en nom complet (ex: "French")
 */
export function getLanguageNameByCode(code: string): string {
  const language = LANGUAGES.find((lang) => lang.code === code);
  return language?.name || "English";
}

/**
 * Convertit un nom de langue complet (ex: "French") en code (ex: "fr")
 */
export function getLanguageCodeByName(name: string): string {
  const language = LANGUAGES.find((lang) => lang.name === name);
  return language?.code || "en";
}

/**
 * Convertit un nom de langue complet en code Scryfall (ex: "Chinese Simplified" -> "zhs")
 */
export function getScryfallCodeByName(name: string): string {
  const language = LANGUAGES.find((lang) => lang.name === name);
  return language?.scryfallCode || "en";
}

/**
 * Convertit un code de langue en code Scryfall (ex: "zh" -> "zhs")
 */
export function getScryfallCodeByCode(code: string): string {
  const language = LANGUAGES.find((lang) => lang.code === code);
  return language?.scryfallCode || "en";
}

/**
 * Retourne la liste des langues disponibles pour les sélecteurs (par nom complet)
 */
export function getAvailableLanguages(): { value: string; label: string }[] {
  return LANGUAGES.map((lang) => ({
    value: lang.name,
    label: lang.name,
  }));
}

/**
 * Retourne la liste des langues disponibles pour les sélecteurs (par code)
 */
export function getAvailableLanguagesByCode(): {
  value: string;
  label: string;
}[] {
  return LANGUAGES.map((lang) => ({
    value: lang.code,
    label: lang.name,
  }));
}
