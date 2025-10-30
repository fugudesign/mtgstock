import axios from "axios";

const SCRYFALL_API_BASE = "https://api.scryfall.com";

// Types pour l'API Scryfall
export interface MTGCard {
  id: string;
  name: string;
  printed_name?: string; // Nom traduit pour les cartes non-anglaises
  printed_type_line?: string; // Type traduit
  printed_text?: string; // Texte d'oracle traduit
  lang: string;
  released_at: string;
  uri: string;
  scryfall_uri: string;
  layout: string;
  oracle_id?: string; // ID Oracle pour retrouver toutes les versions

  // Images
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };

  // Card faces (pour les cartes double-face)
  card_faces?: Array<{
    name: string;
    mana_cost?: string;
    type_line: string;
    oracle_text?: string;
    colors?: string[];
    power?: string;
    toughness?: string;
    image_uris?: {
      small: string;
      normal: string;
      large: string;
      png: string;
    };
  }>;

  // Informations de jeu
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  colors?: string[];
  color_identity?: string[];

  // Set information
  set: string;
  set_name: string;
  set_type: string;
  collector_number: string;
  rarity: string;

  // Artist
  artist?: string;
  flavor_text?: string;

  // Legality
  legalities: {
    standard?: string;
    future?: string;
    historic?: string;
    gladiator?: string;
    pioneer?: string;
    explorer?: string;
    modern?: string;
    legacy?: string;
    pauper?: string;
    vintage?: string;
    penny?: string;
    commander?: string;
    oathbreaker?: string;
    brawl?: string;
    historicbrawl?: string;
    alchemy?: string;
    paupercommander?: string;
    duel?: string;
    oldschool?: string;
    premodern?: string;
    predh?: string;
  };

  // Prix
  prices?: {
    usd?: string;
    usd_foil?: string;
    eur?: string;
    eur_foil?: string;
    tix?: string;
  };

  // Finitions disponibles
  foil?: boolean;
  nonfoil?: boolean;

  // Mots-clés
  keywords?: string[];

  // Liens externes
  related_uris?: {
    gatherer?: string;
    tcgplayer_infinite_articles?: string;
    tcgplayer_infinite_decks?: string;
    edhrec?: string;
  };
}

export interface ScryfallSearchResponse {
  object: "list";
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: MTGCard[];
}

export interface CardSearchParams {
  q?: string; // Query de recherche
  unique?: "cards" | "art" | "prints";
  order?:
    | "name"
    | "set"
    | "released"
    | "rarity"
    | "color"
    | "usd"
    | "tix"
    | "eur"
    | "cmc"
    | "power"
    | "toughness"
    | "edhrec"
    | "artist";
  dir?: "auto" | "asc" | "desc";
  include_extras?: boolean;
  include_multilingual?: boolean;
  include_variations?: boolean;
  page?: number;
  format?: string;
  lang?: string;
}

class ScryfallApiService {
  private baseUrl: string;
  private requestCount: number = 0;
  private lastRequestTime: number = Date.now();
  private requestQueue: Promise<unknown> = Promise.resolve();

  constructor() {
    // Utiliser le proxy API en développement/production
    this.baseUrl =
      typeof window !== "undefined" ? "/api/scryfall" : SCRYFALL_API_BASE;
  }

  // Rate limiting: Scryfall demande 50-100ms entre chaque requête
  private async throttle() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < 100) {
      await new Promise((resolve) =>
        setTimeout(resolve, 100 - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  // Construction de la query Scryfall
  private buildScryfallQuery(params: {
    name?: string;
    colors?: string;
    type?: string;
    rarity?: string;
    set?: string;
    lang?: string;
  }): string {
    const queryParts: string[] = [];

    if (params.name) {
      queryParts.push(`${params.name}`);
    }

    if (params.colors) {
      const colorMap: Record<string, string> = {
        white: "w",
        blue: "u",
        black: "b",
        red: "r",
        green: "g",
      };
      const colors = params.colors
        .toLowerCase()
        .split(",")
        .map((c) => c.trim());
      colors.forEach((color) => {
        const colorCode = colorMap[color] || color;
        queryParts.push(`c:${colorCode}`);
      });
    }

    if (params.type) {
      queryParts.push(`t:${params.type}`);
    }

    if (params.rarity) {
      queryParts.push(`r:${params.rarity.toLowerCase()}`);
    }

    if (params.set) {
      queryParts.push(`set:${params.set.toLowerCase()}`);
    }

    if (params.lang) {
      const langMap: Record<string, string> = {
        french: "fr",
        français: "fr",
        english: "en",
        german: "de",
        spanish: "es",
        italian: "it",
        "portuguese (brazil)": "pt",
        japanese: "ja",
        "chinese simplified": "zhs",
        "chinese traditional": "zht",
        korean: "ko",
        russian: "ru",
      };
      const langCode =
        langMap[params.lang.toLowerCase()] || params.lang.toLowerCase();
      queryParts.push(`lang:${langCode}`);
    }

    return queryParts.join(" ");
  }

  // Cache pour la pagination côté client
  private currentSearch: {
    query: string;
    allCards: MTGCard[];
    total: number;
    hasMoreFromApi: boolean;
  } | null = null;

  async searchCards(params: {
    name?: string;
    colors?: string;
    type?: string;
    rarity?: string;
    set?: string;
    language?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ cards: MTGCard[]; hasMore: boolean; total?: number }> {
    // Le throttling est maintenant géré côté serveur dans les routes proxy

    try {
      const query = this.buildScryfallQuery({
        name: params.name,
        colors: params.colors,
        type: params.type,
        rarity: params.rarity,
        set: params.set,
        lang: params.language,
      });

      if (!query || query.trim() === "") {
        return { cards: [], hasMore: false, total: 0 };
      }

      const pageSize = params.pageSize || 12;
      const currentPage = params.page || 1;

      // Si c'est une nouvelle recherche (page 1) ou si la query a changé
      if (
        currentPage === 1 ||
        !this.currentSearch ||
        this.currentSearch.query !== query
      ) {
        // Réinitialiser le cache et faire une nouvelle requête API
        this.currentSearch = null;

        const searchParams = new URLSearchParams({
          q: query,
          unique: "prints",
          order: "name",
          page: "1", // Toujours commencer par la page 1 de l'API
        });

        const url =
          typeof window !== "undefined"
            ? `/api/scryfall/search?${searchParams}`
            : `${this.baseUrl}/cards/search?${searchParams}`;

        const response = await axios.get<ScryfallSearchResponse>(url);

        // Sauvegarder dans le cache
        this.currentSearch = {
          query,
          allCards: response.data.data,
          total: response.data.total_cards,
          hasMoreFromApi: response.data.has_more,
        };
      }

      // Calculer les cartes pour cette page côté client
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const cardsForPage = this.currentSearch.allCards.slice(
        startIndex,
        endIndex
      );

      // Si on n'a pas assez de cartes et qu'il y en a plus côté API, charger plus
      if (cardsForPage.length < pageSize && this.currentSearch.hasMoreFromApi) {
        // Charger la page suivante de l'API
        const nextApiPage =
          Math.floor(this.currentSearch.allCards.length / 175) + 1; // Scryfall renvoie ~175 cartes par page

        const searchParams = new URLSearchParams({
          q: query,
          unique: "prints",
          order: "name",
          page: (nextApiPage + 1).toString(),
        });

        const url =
          typeof window !== "undefined"
            ? `/api/scryfall/search?${searchParams}`
            : `${this.baseUrl}/cards/search?${searchParams}`;

        const response = await axios.get<ScryfallSearchResponse>(url);

        // Ajouter les nouvelles cartes au cache
        this.currentSearch.allCards.push(...response.data.data);
        this.currentSearch.hasMoreFromApi = response.data.has_more;

        // Recalculer les cartes pour cette page
        const updatedCardsForPage = this.currentSearch.allCards.slice(
          startIndex,
          endIndex
        );

        return {
          cards: updatedCardsForPage,
          hasMore:
            endIndex < this.currentSearch.allCards.length ||
            this.currentSearch.hasMoreFromApi,
          total: this.currentSearch.total,
        };
      }

      return {
        cards: cardsForPage,
        hasMore:
          endIndex < this.currentSearch.allCards.length ||
          this.currentSearch.hasMoreFromApi,
        total: this.currentSearch.total,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Aucun résultat trouvé
        return { cards: [], hasMore: false, total: 0 };
      }
      console.error("Erreur lors de la recherche:", error);
      throw new Error("Échec de la recherche de cartes");
    }
  }

  async getCardByName(name: string, set?: string): Promise<MTGCard | null> {
    await this.throttle();

    try {
      const params = set
        ? new URLSearchParams({ exact: name, set })
        : new URLSearchParams({ exact: name });

      const response = await axios.get<MTGCard>(
        `${this.baseUrl}/cards/named?${params}`
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération de la carte:", error);
      return null;
    }
  }

  async getCardById(id: string): Promise<MTGCard | null> {
    // Le throttling est maintenant géré côté serveur dans les routes proxy

    try {
      const url =
        typeof window !== "undefined"
          ? `/api/scryfall/cards/${id}`
          : `${this.baseUrl}/cards/${id}`;

      const response = await axios.get<MTGCard>(url);
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la carte par ID:",
        error
      );
      return null;
    }
  }

  async getRandomCards(count: number = 10): Promise<MTGCard[]> {
    const cards: MTGCard[] = [];

    for (let i = 0; i < count; i++) {
      await this.throttle();
      try {
        const response = await axios.get<MTGCard>(
          `${this.baseUrl}/cards/random`
        );
        cards.push(response.data);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de carte aléatoire:",
          error
        );
      }
    }

    return cards;
  }

  async autocomplete(query: string): Promise<string[]> {
    // Le throttling est maintenant géré côté serveur dans les routes proxy

    try {
      const url =
        typeof window !== "undefined"
          ? `/api/scryfall/autocomplete?q=${encodeURIComponent(query)}`
          : `${this.baseUrl}/cards/autocomplete?q=${encodeURIComponent(query)}`;

      const response = await axios.get<{
        object: string;
        total_values: number;
        data: string[];
      }>(url);
      return response.data.data;
    } catch (error) {
      console.error("Erreur lors de l'autocomplétion:", error);
      return [];
    }
  }

  async getSets(): Promise<Array<{ code: string; name: string }>> {
    await this.throttle();

    try {
      const response = await axios.get(`${this.baseUrl}/sets`);
      return response.data.data.map((set: { code: string; name: string }) => ({
        code: set.code,
        name: set.name,
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des sets:", error);
      return [];
    }
  }
}

// Singleton
export const mtgApiService = new ScryfallApiService();

// Utilitaires pour les cartes
export const getCardImageUrl = (card: MTGCard): string => {
  // Gère les cartes double-face
  if (card.card_faces && card.card_faces[0]?.image_uris) {
    return card.card_faces[0].image_uris.normal;
  }
  return card.image_uris?.normal || "/placeholder-card.svg";
};

export const formatManaCost = (manaCost?: string): string => {
  if (!manaCost) return "";
  return manaCost.replace(/[{}]/g, "");
};

export const getCardColors = (card: MTGCard): string[] => {
  return card.colors || [];
};

export const isCardLegal = (card: MTGCard, format: string): boolean => {
  const legality =
    card.legalities[format.toLowerCase() as keyof typeof card.legalities];
  return legality === "legal";
};

export const getCardText = (card: MTGCard): string => {
  if (card.card_faces && card.card_faces.length > 0) {
    return card.card_faces
      .map((face) => face.oracle_text)
      .filter(Boolean)
      .join("\n---\n");
  }
  return card.oracle_text || "";
};

export const getCardType = (card: MTGCard): string => {
  if (card.card_faces && card.card_faces.length > 0) {
    return card.card_faces[0].type_line;
  }
  return card.type_line || "";
};

export const getCardManaCost = (card: MTGCard): string => {
  if (
    card.card_faces &&
    card.card_faces.length > 0 &&
    card.card_faces[0].mana_cost
  ) {
    return card.card_faces[0].mana_cost;
  }
  return card.mana_cost || "";
};

// Obtenir le nom localisé de la carte (printed_name si disponible, sinon name)
export const getCardName = (card: MTGCard): string => {
  return card.printed_name || card.name;
};

// Obtenir le type localisé de la carte
export const getCardTypeLine = (card: MTGCard): string => {
  if (card.printed_type_line) return card.printed_type_line;
  if (card.card_faces && card.card_faces.length > 0) {
    return card.card_faces[0].type_line;
  }
  return card.type_line || "";
};

// Obtenir le texte d'oracle localisé
export const getCardOracleText = (card: MTGCard): string => {
  if (card.printed_text) return card.printed_text;
  if (card.oracle_text) return card.oracle_text;
  if (card.card_faces && card.card_faces.length > 0) {
    return card.card_faces
      .map((face) => face.oracle_text)
      .filter(Boolean)
      .join("\n---\n");
  }
  return "";
};

// Vérifier si une carte a plusieurs faces
export const isDoubleFacedCard = (card: MTGCard): boolean => {
  return (
    card.card_faces !== undefined &&
    card.card_faces.length > 1 &&
    card.card_faces.every((face) => face.image_uris !== undefined)
  );
};

// Obtenir toutes les images des faces d'une carte
export const getCardFaceImages = (
  card: MTGCard
): Array<{ name: string; image: string }> => {
  if (card.card_faces && card.card_faces.length > 1) {
    return card.card_faces
      .filter((face) => face.image_uris)
      .map((face) => ({
        name: face.name,
        image: face.image_uris!.large || face.image_uris!.normal,
      }));
  }
  return [];
};
