"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAvailableLanguages } from "@/lib/language-mapper";
import { SearchFormValues } from "@/lib/search-schema";
import { Controller, UseFormReturn } from "react-hook-form";

interface SearchFiltersProps {
  form: UseFormReturn<SearchFormValues>;
  userLanguage?: string;
}

/**
 * Composant des filtres de recherche avancés
 * Contrôlé par react-hook-form pour une gestion cohérente
 */
export function SearchFilters({ form, userLanguage }: SearchFiltersProps) {
  const languageValue = form.watch("language");

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Rareté */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Rareté
        </label>
        <Controller
          name="rarity"
          control={form.control}
          render={({ field }) => (
            <Select
              value={field.value || "all"}
              onValueChange={(value) => {
                field.onChange(value === "all" ? "" : value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="common">Common</SelectItem>
                <SelectItem value="uncommon">Uncommon</SelectItem>
                <SelectItem value="rare">Rare</SelectItem>
                <SelectItem value="mythic rare">Mythic Rare</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Couleurs */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Couleurs
        </label>
        <Controller
          name="colors"
          control={form.control}
          render={({ field }) => (
            <Input {...field} type="text" placeholder="ex: red, blue" />
          )}
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Type
        </label>
        <Controller
          name="type"
          control={form.control}
          render={({ field }) => (
            <Input {...field} type="text" placeholder="ex: creature, instant" />
          )}
        />
      </div>

      {/* Extension */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Extension <span className="text-xs text-muted ml-1">(code)</span>
        </label>
        <Controller
          name="set"
          control={form.control}
          render={({ field }) => (
            <Input
              {...field}
              type="text"
              placeholder="ex: KTK, M15"
              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
            />
          )}
        />
      </div>

      {/* Langue */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Langue{" "}
          {userLanguage && languageValue && (
            <span className="text-xs text-muted ml-1">(par défaut)</span>
          )}
        </label>
        <Controller
          name="language"
          control={form.control}
          render={({ field }) => (
            <Select
              value={field.value || "all"}
              onValueChange={(value) => {
                // Convertir "all" en chaîne vide pour l'API
                field.onChange(value === "all" ? "" : value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Toutes les langues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les langues</SelectItem>
                {getAvailableLanguages().map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </div>
  );
}
