"use client";

import { CardGrid } from "@/components/cards/CardGrid";
import { Button } from "@/components/ui/button";
import { getLanguageNameByCode } from "@/lib/language-mapper";
import { mtgApiService, MTGCard } from "@/lib/scryfall-api";
import { Filter, Loader2, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchBar } from "./SearchBar";
import { SearchFilters, SearchFiltersState } from "./SearchFilters";

const PAGE_SIZE = 15;

interface SearchClientProps {
  initialQuery?: string;
  initialFilters?: SearchFiltersState;
  initialPage?: number;
}

/**
 * Composant client principal pour la recherche de cartes
 * Gère l'état, la logique de recherche, et l'interaction avec l'URL
 */
export function SearchClient({
  initialQuery = "",
  initialFilters,
  initialPage = 1,
}: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [cards, setCards] = useState<MTGCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [userLanguage, setUserLanguage] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  const [filters, setFilters] = useState<SearchFiltersState>(
    initialFilters || {
      colors: "",
      type: "",
      rarity: "",
      set: "",
      language: "",
    }
  );

  // Récupérer la langue par défaut de l'utilisateur
  useEffect(() => {
    const fetchUserLanguage = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          const langCode = data.language || "en";
          setUserLanguage(langCode);

          const fullLanguageName = getLanguageNameByCode(langCode);
          setFilters((prev) => ({ ...prev, language: fullLanguageName }));
        }
      } catch (error) {
        console.error("Error fetching user language:", error);
      }
    };

    fetchUserLanguage();
  }, []);

  // Charger les paramètres depuis l'URL au montage
  useEffect(() => {
    if (!isInitialized && userLanguage !== "") {
      const query = searchParams.get("q") || "";
      const colors = searchParams.get("colors") || "";
      const type = searchParams.get("type") || "";
      const rarity = searchParams.get("rarity") || "";
      const set = searchParams.get("set") || "";
      const lang = searchParams.get("lang") || "";
      const page = searchParams.get("page") || "1";

      const defaultLanguage = filters.language;

      setSearchQuery(query);
      setFilters({
        colors,
        type,
        rarity,
        set,
        language: lang || defaultLanguage,
      });

      // Si des paramètres sont présents, lancer la recherche automatiquement
      if (query || colors || type || rarity || set || lang) {
        handleSearchWithParams(
          query,
          { colors, type, rarity, set, language: lang || defaultLanguage },
          parseInt(page)
        );
      }
      setIsInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isInitialized, userLanguage]);

  // Mettre à jour l'URL avec les paramètres de recherche
  const updateURL = (
    query: string,
    currentFilters: SearchFiltersState,
    page: number
  ) => {
    const params = new URLSearchParams();

    if (query.trim()) params.set("q", query.trim());
    if (currentFilters.colors) params.set("colors", currentFilters.colors);
    if (currentFilters.type) params.set("type", currentFilters.type);
    if (currentFilters.rarity) params.set("rarity", currentFilters.rarity);
    if (currentFilters.set) params.set("set", currentFilters.set);
    if (currentFilters.language) params.set("lang", currentFilters.language);
    if (page > 1) params.set("page", page.toString());

    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  // Effectuer la recherche avec des paramètres spécifiques
  const handleSearchWithParams = async (
    query: string,
    currentFilters: SearchFiltersState,
    page = 1
  ) => {
    if (
      !query.trim() &&
      !currentFilters.colors &&
      !currentFilters.type &&
      !currentFilters.rarity &&
      !currentFilters.set &&
      !currentFilters.language
    ) {
      return;
    }

    setLoading(true);

    try {
      const searchParams: Record<string, string | number> = {
        page,
        pageSize: PAGE_SIZE,
      };

      if (query.trim()) searchParams.name = query;
      if (currentFilters.colors) searchParams.colors = currentFilters.colors;
      if (currentFilters.type) searchParams.type = currentFilters.type;
      if (currentFilters.rarity) searchParams.rarity = currentFilters.rarity;
      if (currentFilters.set) searchParams.set = currentFilters.set;
      if (currentFilters.language)
        searchParams.language = currentFilters.language;

      const result = await mtgApiService.searchCards(searchParams);

      if (page === 1) {
        setCards(result.cards);
      } else {
        setCards((prev) => [...prev, ...result.cards]);
      }

      setHasMore(result.hasMore);
      setTotalResults(result.total || 0);
      setCurrentPage(page);

      updateURL(query, currentFilters, page);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    handleSearchWithParams(searchQuery, filters, 1);
  };

  const handleLoadMore = () => {
    handleSearchWithParams(searchQuery, filters, currentPage + 1);
  };

  const getEmptyDescription = () => {
    if (searchQuery || Object.values(filters).some((f) => f)) {
      return "Essayez avec des termes différents ou modifiez les filtres";
    }
    return "Commencez votre recherche en entrant un nom de carte";
  };

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="flex flex-col md:flex-row gap-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          loading={loading}
        />
        <div className="flex gap-4">
          <Button
            onClick={handleSearch}
            disabled={loading}
            size="lg"
            className="flex-1 md:flex-none"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Recherche...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Rechercher
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="pt-6 border-t border-border">
          <SearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            userLanguage={userLanguage}
          />
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
