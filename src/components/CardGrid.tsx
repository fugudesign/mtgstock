"use client";

import { CardDisplay } from "@/components/CardDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MTGCard } from "@/lib/scryfall-api";
import { Loader2, Search } from "lucide-react";

interface CardGridProps {
  cards: MTGCard[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  emptyDescription?: string;
  showActions?: boolean;
  context?: "search" | "collection" | "deck";
  onCardRemove?: (cardId: string) => Promise<void>;
  skeletonCount?: number;
}

/**
 * Composant mutualisé pour l'affichage des cartes en grille
 * Utilisé dans: search, collections, decks
 */
export function CardGrid({
  cards,
  loading = false,
  hasMore = false,
  onLoadMore,
  emptyMessage = "Aucune carte",
  emptyDescription = "Aucune carte à afficher pour le moment",
  showActions = true,
  context = "search",
  onCardRemove,
  skeletonCount = 10,
}: CardGridProps) {
  // Handler pour le bouton Load More
  const handleLoadMore = () => {
    if (onLoadMore && !loading) {
      onLoadMore();
    }
  };

  // Handler pour la suppression d'une carte
  const handleCardRemove = async (cardId: string) => {
    if (onCardRemove) {
      await onCardRemove(cardId);
    }
  };

  // Affichage du loading skeleton (première charge)
  if (loading && cards.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="aspect-5/7 bg-muted rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Affichage de l'empty state
  if (cards.length === 0 && !loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {emptyMessage}
          </h3>
          <p className="text-muted-foreground">{emptyDescription}</p>
        </CardContent>
      </Card>
    );
  }

  // Affichage de la grille de cartes
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <CardDisplay
            key={card.id}
            card={card}
            showActions={showActions}
            context={context}
            onRemove={
              onCardRemove ? () => handleCardRemove(card.id) : undefined
            }
          />
        ))}
      </div>

      {/* Bouton Load More */}
      {hasMore && onLoadMore && (
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
  );
}
