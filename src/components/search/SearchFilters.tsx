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

export interface SearchFiltersState {
  colors: string;
  type: string;
  rarity: string;
  set: string;
  language: string;
}

interface SearchFiltersProps {
  filters: SearchFiltersState;
  onFiltersChange: (filters: SearchFiltersState) => void;
  userLanguage?: string;
}

/**
 * Composant des filtres de recherche avancés
 * Utilise shadcn Select et Input pour une UX cohérente
 */
export function SearchFilters({
  filters,
  onFiltersChange,
  userLanguage,
}: SearchFiltersProps) {
  const handleFilterChange = (key: keyof SearchFiltersState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Langue */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Langue{" "}
          {userLanguage && filters.language && (
            <span className="text-xs text-primary ml-1">(par défaut)</span>
          )}
        </label>
        <Select
          value={filters.language}
          onValueChange={(value) => handleFilterChange("language", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Toutes les langues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toutes les langues</SelectItem>
            {getAvailableLanguages().map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Couleurs */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Couleurs
        </label>
        <Input
          type="text"
          placeholder="ex: red, blue"
          value={filters.colors}
          onChange={(e) => handleFilterChange("colors", e.target.value)}
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Type
        </label>
        <Input
          type="text"
          placeholder="ex: creature, instant"
          value={filters.type}
          onChange={(e) => handleFilterChange("type", e.target.value)}
        />
      </div>

      {/* Rareté */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Rareté
        </label>
        <Select
          value={filters.rarity}
          onValueChange={(value) => handleFilterChange("rarity", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Toutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toutes</SelectItem>
            <SelectItem value="common">Common</SelectItem>
            <SelectItem value="uncommon">Uncommon</SelectItem>
            <SelectItem value="rare">Rare</SelectItem>
            <SelectItem value="mythic rare">Mythic Rare</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Extension */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Extension (code)
        </label>
        <Input
          type="text"
          placeholder="ex: KTK, M15"
          value={filters.set}
          onChange={(e) =>
            handleFilterChange("set", e.target.value.toUpperCase())
          }
        />
      </div>
    </div>
  );
}
