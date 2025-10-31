"use client";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { CardGrid } from "@/components/CardGrid";
import { EditModal } from "@/components/EditModal";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MTGCard } from "@/lib/scryfall-api";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Edit, Info, Plus, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Card {
  id: string;
  name: string;
  imageUrl: string | null;
  manaCost: string | null;
  type: string | null;
}

interface DeckCard {
  id: string;
  cardId: string;
  quantity: number;
  card: Card;
}

interface Deck {
  id: string;
  name: string;
  description: string | null;
  format: string;
  createdAt: string;
  cards: DeckCard[];
}

export default function DeckDetailsPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const deckId = params.id as string;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchDeck = useCallback(async () => {
    try {
      const response = await fetch(`/api/decks/${deckId}`);
      if (response.ok) {
        const data = await response.json();
        setDeck(data);
      } else if (response.status === 404) {
        toast.error("Deck introuvable");
        router.push("/decks");
      }
    } catch (error) {
      console.error("Error fetching deck:", error);
      toast.error("Erreur lors du chargement du deck");
    } finally {
      setLoading(false);
    }
  }, [deckId, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated" && deckId) {
      fetchDeck();
    }
  }, [status, deckId, router, fetchDeck]);

  const getDeckStatus = () => {
    if (!deck) return null;

    const totalCards = deck.cards.reduce((sum, dc) => sum + dc.quantity, 0);

    const cardCopies: { [key: string]: number } = {};
    deck.cards.forEach((dc) => {
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen py-8">
        <div className=" mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!deck) {
    return null;
  }

  const deckStatus = getDeckStatus();

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
      // Ajouter les infos de quantité pour le CardDisplay
      quantity: deckCard.quantity,
    } as unknown as MTGCard;
  };

  // Handler pour la suppression d'une carte du deck
  const handleRemoveCard = async (cardId: string) => {
    if (!confirm("Voulez-vous vraiment retirer cette carte du deck ?")) {
      throw new Error("Suppression annulée par l'utilisateur");
    }

    try {
      const response = await fetch(
        `/api/decks/${deckId}/cards?cardId=${encodeURIComponent(cardId)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        await fetchDeck();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Erreur de suppression" }));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Error removing card:", error);
      throw error; // Re-throw pour que CardDisplay puisse l'attraper
    }
  };

  // Transformer les cartes pour le CardGrid
  const deckMTGCards = deck.cards.map(transformDeckCardToMTGCard);

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <div className=" mx-auto px-4 py-8">
          <PageHeader
            title={deck.name}
            subtitle={deck.description}
            infos={
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <Badge variant="outline" size="sm">
                  Deck {deck.format}
                </Badge>
                {deckStatus && (
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded border",
                      deckStatus.isValid
                        ? "bg-green-700/20 text-green-300 border-green-700"
                        : "bg-red-700/20 text-red-300 border-red-700"
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
            <Button size="sm" asChild>
              <Link href="/cards">
                <Plus />
                <span data-slot="text">Ajouter des cartes</span>
              </Link>
            </Button>
            <Button size="sm" onClick={() => setShowEditModal(true)}>
              <Edit />
              <span data-slot="text">Modifier</span>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/decks">
                <X />
                <span data-slot="text">Retour</span>
              </Link>
            </Button>
          </PageHeader>

          {/* Validation Warnings */}
          {deckStatus && !deckStatus.isValid && (
            <Card className="mb-6 border-orange-500 text-orange-400 bg-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-orange-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-400 mb-2">
                      Ce deck n’est pas encore valide.
                    </h3>
                    <ul className="space-y-1 text-sm text-orange-500">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cartes du deck */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Cartes ({deckStatus?.totalCards || 0})
            </h2>
            <CardGrid
              cards={deckMTGCards}
              context="deck"
              showActions={true}
              onCardRemove={handleRemoveCard}
              emptyMessage="Aucune carte dans ce deck"
              emptyDescription="Ajoutez des cartes depuis la recherche."
            />
          </div>

          {/* Edit Deck Modal */}
          {deck && (
            <EditModal
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              onSuccess={fetchDeck}
              type="deck"
              item={deck}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
