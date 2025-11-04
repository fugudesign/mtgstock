"use client";

import { CardGrid } from "@/components/cards/CardGrid";
import { SearchBar } from "@/components/search/SearchBar";
import { getLanguageNameByCode } from "@/lib/language-mapper";
import { mtgApiService, MTGCard } from "@/lib/scryfall-api";
import {
  buildSearchParams,
  hasRealSearchCriteria,
  hasSearchValues,
  parseSearchParams,
  searchFormSchema,
  SearchFormValues,
} from "@/lib/search-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { SearchFilters } from "./SearchFilters";

const PAGE_SIZE = 15;

/**
 * Composant client principal pour la recherche de cartes
 * Utilise react-hook-form + Zod pour une gestion robuste du formulaire
 */
export function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<MTGCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [userLanguage, setUserLanguage] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialiser le formulaire avec react-hook-form
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    mode: "onChange",
    defaultValues: {
      query: "",
      colors: "",
      type: "",
      rarity: "",
      set: "",
      language: "",
    },
  });

  // Récupérer la langue par défaut de l'utilisateur
  useEffect(() => {
    const fetchUserLanguage = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          const langCode = data.language || "en";
          setUserLanguage(langCode);
          // Ne pas faire form.setValue ici, on le fera dans l'autre useEffect
        }
      } catch (error) {
        console.error("Error fetching user language:", error);
      }
    };

    fetchUserLanguage();
  }, []);

  // Initialiser depuis l'URL une seule fois, de manière synchrone
  useEffect(() => {
    if (!isInitialized && userLanguage !== "") {
      const values = parseSearchParams(searchParams);

      // Si pas de langue dans l'URL, utiliser celle de l'utilisateur
      if (!values.language) {
        const fullLanguageName = getLanguageNameByCode(userLanguage);
        values.language = fullLanguageName;
      }

      // Mettre à jour le formulaire avec les valeurs de l'URL (+ langue par défaut)
      form.reset(values);

      // Si des paramètres sont présents (hors langue par défaut), lancer la recherche automatiquement
      if (hasRealSearchCriteria(values)) {
        performSearch(values, 1);
      }

      setIsInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isInitialized, userLanguage]);

  // Effectuer la recherche avec des paramètres spécifiques
  const performSearch = async (values: SearchFormValues, page = 1) => {
    if (!hasSearchValues(values)) {
      return;
    }

    setLoading(true);

    try {
      const apiParams: Record<string, string | number> = {
        page,
        pageSize: PAGE_SIZE,
      };

      if (values.query) apiParams.name = values.query;
      if (values.colors) apiParams.colors = values.colors;
      if (values.type) apiParams.type = values.type;
      if (values.rarity) apiParams.rarity = values.rarity;
      if (values.set) apiParams.set = values.set;
      if (values.language) apiParams.language = values.language;

      const result = await mtgApiService.searchCards(apiParams);

      if (page === 1) {
        setCards(result.cards);
      } else {
        setCards((prev) => [...prev, ...result.cards]);
      }

      setHasMore(result.hasMore);
      setTotalResults(result.total || 0);
      setCurrentPage(page);

      // Mettre à jour l'URL
      const params = buildSearchParams(values);
      if (page > 1) params.set("page", page.toString());
      router.push(`/search?${params.toString()}`, { scroll: false });
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = form.handleSubmit((values) => {
    setCurrentPage(1);
    performSearch(values, 1);
  });

  const handleLoadMore = () => {
    const values = form.getValues();
    performSearch(values, currentPage + 1);
  };

  const getEmptyDescription = () => {
    const values = form.getValues();
    if (hasSearchValues(values)) {
      return "Essayez avec des termes différents ou modifiez les filtres";
    }
    return "Commencez votre recherche en entrant un nom de carte";
  };

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <SearchBar
        form={form}
        handleSearch={handleSearch}
        handleOpenFilters={() => setShowFilters(!showFilters)}
        loading={loading}
        isInitialized={isInitialized}
      />

      {/* Filtres avancés */}
      {showFilters && (
        <div className="pt-6 border-t border-border">
          <SearchFilters form={form} userLanguage={userLanguage} />
        </div>
      )}

      {/* Compteur de résultats */}
      {totalResults > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Affichage de {cards.length} sur {totalResults} résultat
            {totalResults > 1 ? "s" : ""}
          </div>
          {hasMore && (
            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Plus de cartes disponibles
            </div>
          )}
        </div>
      )}

      {/* Grille de résultats */}
      <CardGrid
        cards={cards}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        emptyMessage="Aucun résultat"
        emptyDescription={getEmptyDescription()}
        showActions={true}
        context="search"
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
