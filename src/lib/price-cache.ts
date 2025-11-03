/**
 * Cache client-side pour les prix des cartes
 * TTL: 24h (prix mis à jour quotidiennement par Scryfall)
 */

import { MTGCard } from "./scryfall-api";

interface CachedPrice {
  prices: MTGCard["prices"];
  timestamp: number;
}

class PriceCache {
  private cache = new Map<string, CachedPrice>();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

  /**
   * Récupère les prix en cache pour une carte
   * Retourne null si expiré ou non trouvé
   */
  get(cardId: string): MTGCard["prices"] | null {
    const cached = this.cache.get(cardId);

    if (!cached) {
      return null;
    }

    // Vérifier si le cache est expiré
    if (this.isExpired(cached.timestamp)) {
      this.cache.delete(cardId);
      return null;
    }

    return cached.prices;
  }

  /**
   * Stocke les prix d'une carte dans le cache
   */
  set(cardId: string, prices: MTGCard["prices"]): void {
    this.cache.set(cardId, {
      prices,
      timestamp: Date.now(),
    });
  }

  /**
   * Vérifie si un timestamp est expiré (> 24h)
   */
  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.TTL;
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Supprime les entrées expirées du cache
   */
  cleanup(): void {
    for (const [cardId, cached] of this.cache.entries()) {
      if (this.isExpired(cached.timestamp)) {
        this.cache.delete(cardId);
      }
    }
  }

  /**
   * Retourne la taille actuelle du cache
   */
  size(): number {
    return this.cache.size;
  }
}

// Singleton pour utilisation globale
export const priceCache = new PriceCache();

// Cleanup automatique toutes les heures
if (typeof window !== "undefined") {
  setInterval(() => {
    priceCache.cleanup();
  }, 60 * 60 * 1000); // 1 heure
}
