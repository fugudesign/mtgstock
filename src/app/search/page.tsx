"use client";

import { CardDisplay } from "@/components/CardDisplay";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mtgApiService, MTGCard } from "@/lib/scryfall-api";
import { Filter, Loader2, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function SearchPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [cards, setCards] = useState<MTGCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [userLanguage, setUserLanguage] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [filters, setFilters] = useState({
    colors: "",
    type: "",
    rarity: "",
    set: "",
    language: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Close suggestions when clicking outside
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

  // Fetch suggestions when user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setSuggestionLoading(true);
      try {
        const response = await fetch(
          `/api/scryfall/autocomplete?q=${encodeURIComponent(searchQuery)}`
        );
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
  }, [searchQuery]);

  // Fetch user's default language
  useEffect(() => {
    if (status === "authenticated") {
      fetchUserLanguage();
    }
  }, [status]);

  // Load search params from URL on mount
  useEffect(() => {
    if (!isInitialized && userLanguage !== "") {
      const query = searchParams.get("q") || "";
      const colors = searchParams.get("colors") || "";
      const type = searchParams.get("type") || "";
      const rarity = searchParams.get("rarity") || "";
      const set = searchParams.get("set") || "";
      const lang = searchParams.get("lang") || "";
      const page = searchParams.get("page") || "1";

      setSearchQuery(query);
      setFilters({
        colors,
        type,
        rarity,
        set,
        language: lang || filters.language, // Utilise la langue de l'URL ou celle par défaut
      });

      // Si des paramètres sont présents, lancer la recherche automatiquement
      if (query || colors || type || rarity || set || lang) {
        setIsInitialized(true);
        handleSearchWithParams(
          query,
          { colors, type, rarity, set, language: lang || filters.language },
          parseInt(page)
        );
      } else {
        setIsInitialized(true);
      }
    }
  }, [searchParams, isInitialized, userLanguage]);

  const fetchUserLanguage = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        const langCode = data.language || "en";
        setUserLanguage(langCode);

        // Convert language code to full name for Scryfall
        const languageMap: { [key: string]: string } = {
          en: "English",
          fr: "French",
          de: "German",
          es: "Spanish",
          it: "Italian",
          pt: "Portuguese (Brazil)",
          ja: "Japanese",
          ko: "Korean",
          ru: "Russian",
          zh: "Chinese Simplified",
        };

        const fullLanguageName = languageMap[langCode] || "English";

        // Set the language filter to user's default
        setFilters((prev) => ({ ...prev, language: fullLanguageName }));
      }
    } catch (error) {
      console.error("Error fetching user language:", error);
    }
  };

  // Fonction pour mettre à jour l'URL avec les paramètres de recherche
  const updateURL = (
    query: string,
    currentFilters: typeof filters,
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

  // Fonction pour effectuer la recherche avec des paramètres spécifiques
  const handleSearchWithParams = async (
    query: string,
    currentFilters: typeof filters,
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

    setShowSuggestions(false);
    setLoading(true);

    try {
      const searchParams: Record<string, string | number> = {
        page,
        pageSize: 20,
      };

      if (query.trim()) {
        searchParams.name = query;
      }
      if (currentFilters.colors) {
        searchParams.colors = currentFilters.colors;
      }
      if (currentFilters.type) {
        searchParams.type = currentFilters.type;
      }
      if (currentFilters.rarity) {
        searchParams.rarity = currentFilters.rarity;
      }
      if (currentFilters.set) {
        searchParams.set = currentFilters.set;
      }
      if (currentFilters.language) {
        searchParams.language = currentFilters.language;
      }

      const result = await mtgApiService.searchCards(searchParams);

      if (page === 1) {
        setCards(result.cards);
      } else {
        setCards((prev) => [...prev, ...result.cards]);
      }

      setHasMore(result.hasMore);
      setTotalResults(result.total || 0);
      setCurrentPage(page);

      // Mettre à jour l'URL
      updateURL(query, currentFilters, page);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (page = 1) => {
    await handleSearchWithParams(searchQuery, filters, page);
  };

  const handleLoadMore = () => {
    handleSearch(currentPage + 1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
      handleSearch(1);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Recherche de cartes
            </h1>
            <p className="text-muted-foreground">
              Recherchez parmi plus de 30 000 cartes Magic: The Gathering
            </p>
            <p className="text-sm text-primary mt-1">
              💡 Astuce : Utilisez le filtre &quot;Langue&quot; pour rechercher
              des cartes en français
            </p>
          </div>

          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Nom de la carte (ex: Lightning Bolt, Ancestral Recall...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() => {
                      setIsInputFocused(true);
                      if (suggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow click on suggestions
                      setTimeout(() => {
                        setIsInputFocused(false);
                        setShowSuggestions(false);
                      }, 200);
                    }}
                    className="pl-10 h-12 text-lg"
                  />

                  {/* Suggestions dropdown */}
                  {showSuggestions &&
                    suggestions.length > 0 &&
                    isInputFocused && (
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
                            onClick={() => {
                              setSearchQuery(suggestion);
                              setShowSuggestions(false);
                              handleSearch(1);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-accent transition-colors text-foreground border-b border-border last:border-b-0"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
                <Button
                  onClick={() => handleSearch(1)}
                  disabled={loading}
                  size="lg"
                  className="min-w-[120px]"
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

              {/* Quick examples */}
              {!showFilters && cards.length === 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    Exemples de recherche :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSearchQuery("Jace");
                        handleSearch(1);
                      }}
                      className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                    >
                      Jace
                    </button>
                    <button
                      onClick={() => {
                        setSearchQuery("Lightning Bolt");
                        handleSearch(1);
                      }}
                      className="px-3 py-1 text-xs bg-destructive/10 text-destructive rounded-full hover:bg-destructive/20 transition-colors"
                    >
                      Lightning Bolt
                    </button>
                    <button
                      onClick={() => {
                        setSearchQuery("Black Lotus");
                        handleSearch(1);
                      }}
                      className="px-3 py-1 text-xs bg-purple-500/10 text-purple-400 rounded-full hover:bg-purple-500/20 transition-colors"
                    >
                      Black Lotus
                    </button>
                    <button
                      onClick={() => {
                        setFilters({ ...filters, language: "French" });
                        setShowFilters(true);
                      }}
                      className="px-3 py-1 text-xs bg-green-500/10 text-green-400 rounded-full hover:bg-green-500/20 transition-colors"
                    >
                      🇫🇷 Rechercher en français
                    </button>
                  </div>
                </div>
              )}

              {/* Filters */}
              {showFilters && (
                <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Langue{" "}
                      {userLanguage && filters.language && (
                        <span className="text-xs text-primary ml-1">
                          (par défaut)
                        </span>
                      )}
                    </label>
                    <select
                      value={filters.language}
                      onChange={(e) =>
                        setFilters({ ...filters, language: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
                    >
                      <option value="">Toutes les langues</option>
                      <option value="French">Français</option>
                      <option value="English">Anglais</option>
                      <option value="German">Allemand</option>
                      <option value="Spanish">Espagnol</option>
                      <option value="Italian">Italien</option>
                      <option value="Portuguese (Brazil)">
                        Portugais (Brésil)
                      </option>
                      <option value="Japanese">Japonais</option>
                      <option value="Chinese Simplified">
                        Chinois Simplifié
                      </option>
                      <option value="Chinese Traditional">
                        Chinois Traditionnel
                      </option>
                      <option value="Korean">Coréen</option>
                      <option value="Russian">Russe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Couleurs
                    </label>
                    <Input
                      type="text"
                      placeholder="ex: red, blue"
                      value={filters.colors}
                      onChange={(e) =>
                        setFilters({ ...filters, colors: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Type
                    </label>
                    <Input
                      type="text"
                      placeholder="ex: creature, instant"
                      value={filters.type}
                      onChange={(e) =>
                        setFilters({ ...filters, type: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Rareté
                    </label>
                    <select
                      value={filters.rarity}
                      onChange={(e) =>
                        setFilters({ ...filters, rarity: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
                    >
                      <option value="">Toutes</option>
                      <option value="common">Common</option>
                      <option value="uncommon">Uncommon</option>
                      <option value="rare">Rare</option>
                      <option value="mythic rare">Mythic Rare</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Extension (code)
                    </label>
                    <Input
                      type="text"
                      placeholder="ex: KTK, M15"
                      value={filters.set}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          set: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Count */}
          {totalResults > 0 && (
            <div className="mb-4 text-sm text-muted-foreground">
              {totalResults} résultat{totalResults > 1 ? "s" : ""} trouvé
              {totalResults > 1 ? "s" : ""}
            </div>
          )}

          {/* Results Grid */}
          {cards.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
                {cards.map((card) => (
                  <CardDisplay key={card.id} card={card} showActions={true} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loading}
                    variant="outline"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      "Charger plus de cartes"
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            !loading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Aucun résultat
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery || Object.values(filters).some((f) => f)
                      ? "Essayez avec des termes différents ou modifiez les filtres"
                      : "Commencez votre recherche en entrant un nom de carte"}
                  </p>
                </CardContent>
              </Card>
            )
          )}

          {/* Loading State */}
          {loading && cards.length === 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-5/7 bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
