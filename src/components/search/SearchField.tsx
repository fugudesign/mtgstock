"use client";

import { Input } from "@/components/ui/input";
import { SearchFormValues } from "@/lib/search-schema";
import { cn } from "@/lib/utils";
import { Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, UseFormReturn } from "react-hook-form";

interface SearchFieldProps {
  form: UseFormReturn<SearchFormValues>;
  onSearch: () => void;
  loading?: boolean;
  isInitialized: boolean;
  className?: string;
  inputClassName?: string;
}

/**
 * Composant de barre de recherche avec autocomplétion
 * Contrôlé par react-hook-form, l'autocomplete ne se déclenche que sur focus utilisateur
 */
export function SearchField({
  form,
  onSearch,
  loading = false,
  isInitialized,
  className,
  inputClassName,
}: SearchFieldProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [justSelectedSuggestion, setJustSelectedSuggestion] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const queryValue = form.watch("query");

  // Fermer les suggestions quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Récupérer les suggestions UNIQUEMENT si l'utilisateur a interagi
  useEffect(() => {
    // Ne pas déclencher l'autocomplete pendant l'initialisation ou si pas d'interaction
    if (!isInitialized || !hasUserInteracted || justSelectedSuggestion) {
      return;
    }

    const fetchSuggestions = async () => {
      if (queryValue.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setSuggestionLoading(true);
      try {
        const url = `/api/scryfall/autocomplete?q=${encodeURIComponent(
          queryValue
        )}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.data || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setSuggestionLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [queryValue, isInitialized, hasUserInteracted, justSelectedSuggestion]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch();
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Bloquer immédiatement toute interaction
    setJustSelectedSuggestion(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setHasUserInteracted(false);

    // Mettre à jour la valeur
    form.setValue("query", suggestion);

    // Blur le champ pour éviter le re-focus
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }

    // Lancer la recherche et réinitialiser les flags après un délai
    setTimeout(() => {
      setJustSelectedSuggestion(false);
      onSearch();
    }, 150);
  };

  return (
    <div className={cn("relative flex-1", className)}>
      <Search className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
      <Controller
        name="query"
        control={form.control}
        render={({ field }) => (
          <Input
            {...field}
            ref={searchInputRef}
            type="text"
            placeholder="Nom de la carte (ex: Lightning Bolt, Ancestral Recall...)"
            onKeyPress={handleKeyPress}
            onFocus={() => {
              // Ne réactiver l'autocomplete que si on n'a pas juste sélectionné une suggestion
              if (!justSelectedSuggestion) {
                setHasUserInteracted(true);
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }
            }}
            onChange={(e) => {
              // Ne trigger l'autocomplete que si on n'a pas juste sélectionné une suggestion
              if (!justSelectedSuggestion) {
                setHasUserInteracted(true);
              }
              field.onChange(e);
            }}
            onBlur={() => {
              // Délai pour permettre le clic sur les suggestions
              setTimeout(() => {
                setShowSuggestions(false);
              }, 200);
            }}
            className={cn("md:pl-10 text-lg", inputClassName)}
            disabled={loading}
          />
        )}
      />

      {/* Dropdown des suggestions */}
      {showSuggestions && suggestions.length > 0 && hasUserInteracted && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto"
        >
          {suggestionLoading && (
            <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </div>
          )}
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-accent transition-colors text-foreground border-b border-border last:border-b-0"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
