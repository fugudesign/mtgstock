"use client";

import { CardDisplay } from "@/components/cards/CardDisplay";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { MTGCard } from "@/lib/scryfall-api";
import { cn } from "@/lib/utils";
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
  pageSize?: number; // Pour afficher combien de cartes seront chargées
  emptyContent?: React.ReactNode; // Contenu additionnel dans l'empty state
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
  pageSize = 12,
  emptyContent,
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

  // Classes communes pour la grille - optimisées pour mobile
  const gridClasses =
    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3";

  // Affichage du loading skeleton (première charge)
  if (loading && cards.length === 0) {
    return (
      <div className={gridClasses}>
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
  if (!loading && cards.length === 0) {
    return (
      <Empty className="py-8">
        <EmptyHeader>
          <EmptyMedia>
            <div className="rounded-full bg-muted/50 p-3">
              <Search className="size-6 text-muted-foreground" />
            </div>
          </EmptyMedia>
          <EmptyTitle>{emptyMessage}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
          {emptyContent}
        </EmptyHeader>
      </Empty>
    );
  }

  // Affichage de la grille de cartes
  return (
    <>
      <div className={cn(gridClasses)}>
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
        <div className="mt-8 text-center">
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
              <>Charger {pageSize} cartes supplémentaires</>
            )}
          </Button>
        </div>
      )}
    </>
  );
}
