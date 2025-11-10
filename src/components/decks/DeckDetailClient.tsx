"use client";

import { CardGrid } from "@/components/cards/CardGrid";
import { PageHeader } from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useMediaQuery } from "@/hooks";
import { MTGCard } from "@/lib/scryfall-api";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Edit, Info, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DeckModal } from "./DeckModal";

interface DeckCard {
  id: string;
  cardId: string;
  quantity: number;
  card: {
    id: string;
    name: string;
    imageUrl: string | null;
    manaCost: string | null;
    type: string | null;
  };
}

interface Deck {
  id: string;
  name: string;
  description: string | null;
  format: string;
  isPublic: boolean;
  createdAt: string;
  cards: DeckCard[];
}

interface DeckDetailClientProps {
  deck: Deck;
}

export function DeckDetailClient({ deck: initialDeck }: DeckDetailClientProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getDeckStatus = () => {
    const totalCards = initialDeck.cards.reduce(
      (sum, dc) => sum + dc.quantity,
      0
    );

    const cardCopies: { [key: string]: number } = {};
    initialDeck.cards.forEach((dc) => {
      const cardName = dc.card.name;
      cardCopies[cardName] = (cardCopies[cardName] || 0) + dc.quantity;
    });

    const basicLands = [
      "Plains",
      "Island",
      "Swamp",
      "Mountain",
      "Forest",
      "Wastes",
    ];
    const duplicateIssues = Object.entries(cardCopies).filter(
      ([name, count]) => count > 4 && !basicLands.includes(name)
    );

    const isValid =
      totalCards >= 40 && totalCards <= 100 && duplicateIssues.length === 0;

    return {
      totalCards,
      duplicateIssues,
      isValid,
    };
  };

  // Fonction pour transformer une DeckCard en MTGCard
  const transformDeckCardToMTGCard = (deckCard: DeckCard): MTGCard => {
    return {
      id: deckCard.card.id,
      name: deckCard.card.name,
      image_uris: deckCard.card.imageUrl
        ? {
            small: deckCard.card.imageUrl,
            normal: deckCard.card.imageUrl,
            large: deckCard.card.imageUrl,
            png: deckCard.card.imageUrl,
            art_crop: deckCard.card.imageUrl,
            border_crop: deckCard.card.imageUrl,
          }
        : undefined,
      set_name: "",
      rarity: "",
      mana_cost: deckCard.card.manaCost || "",
      type_line: deckCard.card.type || "",
      cmc: 0,
      quantity: deckCard.quantity,
    } as unknown as MTGCard;
  };

  // Handler pour la suppression d'une carte du deck
  const handleRemoveCard = async (cardId: string) => {
    try {
      const response = await fetch(
        `/api/decks/${initialDeck.id}/cards?cardId=${encodeURIComponent(
          cardId
        )}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        toast.success("Carte retirée du deck");
        router.refresh(); // Rafraîchir les données server-side
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de la carte");
    }
  };

  // Éditer le deck
  const handleEditDeck = async (data: {
    name: string;
    description: string;
    format: string;
  }) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/decks/${initialDeck.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          format: data.format,
          isPublic: initialDeck.isPublic,
        }),
      });

      if (response.ok) {
        toast.success("Deck modifié avec succès");
        setShowEditModal(false);
        router.refresh();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Error updating deck:", error);
      toast.error("Erreur lors de la modification");
    } finally {
      setSubmitting(false);
    }
  };

  const deckStatus = getDeckStatus();
  const deckMTGCards = initialDeck.cards.map(transformDeckCardToMTGCard);

  return (
    <Container>
      <PageHeader
        title={initialDeck.name}
        subtitle={initialDeck.description}
        infos={
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Badge variant="outline" className="capitalize">
              {initialDeck.format}
            </Badge>
            {deckStatus && (
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded border",
                  deckStatus.isValid
                    ? "bg-green-500/20 text-green-400 border-green-500"
                    : "bg-orange-500/20 text-orange-400 border-orange-500"
                )}
              >
                {deckStatus.isValid ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {deckStatus.totalCards} cartes
                </span>
              </div>
            )}
          </div>
        }
        className="mb-4"
      >
        <Button
          variant="outline"
          size={isDesktop ? "default" : "iconSm"}
          asChild
        >
          <Link href="/decks">
            <X />
            <span data-slot="text">Retour</span>
          </Link>
        </Button>
        <Button
          size={isDesktop ? "default" : "iconSm"}
          onClick={() => setShowEditModal(true)}
        >
          <Edit />
          <span data-slot="text">Modifier</span>
        </Button>
      </PageHeader>

      {/* Validation Warnings */}
      {deckStatus && !deckStatus.isValid && (
        <Alert className="mb-6 border-orange-500 text-orange-400 bg-orange-500/20">
          <Info className="h-5 w-5 text-orange-400" />
          <AlertTitle>Ce deck n&apos;est pas encore valide.</AlertTitle>
          <AlertDescription>
            <ul className="space-y-1">
              {deckStatus.totalCards < 40 && (
                <li>
                  • Minimum 40 cartes requises (actuellement{" "}
                  {deckStatus.totalCards})
                </li>
              )}
              {deckStatus.totalCards > 100 && (
                <li>
                  • Maximum 100 cartes autorisées (actuellement{" "}
                  {deckStatus.totalCards})
                </li>
              )}
              {deckStatus.duplicateIssues.map(([name, count]) => (
                <li key={name}>
                  • {name} : {count} copies (max 4 autorisé)
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {deckMTGCards.length > 0 ? (
        <CardGrid
          cards={deckMTGCards}
          context="deck"
          showActions={true}
          onCardRemove={handleRemoveCard}
        />
      ) : (
        <div className="pt-24">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>Deck vide</EmptyTitle>
              <EmptyDescription>
                Ajoutez des cartes à votre deck depuis la page de recherche.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/search">
                  <Search className="mr-2 h-4 w-4" />
                  Rechercher des cartes
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      )}

      {/* Edit Deck Modal */}
      <DeckModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditDeck}
        deck={{
          id: initialDeck.id,
          name: initialDeck.name,
          description: initialDeck.description,
          format: initialDeck.format,
          isPublic: initialDeck.isPublic,
        }}
        isSubmitting={submitting}
      />
    </Container>
  );
}
