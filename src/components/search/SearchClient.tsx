"use client";

import { CardGrid } from "@/components/cards/CardGrid";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResultsCount } from "@/components/search/SearchResultsCount";
import { useSticky } from "@/hooks";
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
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [userLanguage, setUserLanguage] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Hook pour détecter quand la barre de recherche est sticky
  const [stickyRef, isStuck] = useSticky<HTMLDivElement>();

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

  form.watch(); // Pour re-render à chaque changement de valeur

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
    <div>
      <div
        ref={stickyRef}
        className={cn(
          "sticky top-0 md:top-16 z-40 flex flex-col gap-2 transition-all duration-200 py-4",
          isStuck && "bg-background-dark/95 backdrop-blur-xs shadow-md"
        )}
      >
        {/* Barre de recherche */}
        <SearchBar
          form={form}
          loading={loading}
          isInitialized={isInitialized}
          userLanguage={userLanguage}
          filtersOpen={filtersOpen}
          onSearch={handleSearch}
          onOpenFilters={() => setFiltersOpen(!filtersOpen)}
          onCloseFilters={() => setFiltersOpen(false)}
        />

        {/* Compteur de résultats */}
        <SearchResultsCount
          count={totalResults}
          className="text-primary ml-4"
        />
      </div>

      <div className="space-y-4">
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
    </div>
  );
}
