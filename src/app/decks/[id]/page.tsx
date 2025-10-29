"use client";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { CardGrid } from "@/components/CardGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MTGCard } from "@/lib/scryfall-api";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Info,
  Layers,
  Plus,
} from "lucide-react";
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
  isMainboard: boolean;
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

    const mainboardCount = deck.cards
      .filter((dc) => dc.isMainboard)
      .reduce((sum, dc) => sum + dc.quantity, 0);

    const sideboardCount = deck.cards
      .filter((dc) => !dc.isMainboard)
      .reduce((sum, dc) => sum + dc.quantity, 0);

    const cardCopies: { [key: string]: number } = {};
    deck.cards
      .filter((dc) => dc.isMainboard)
      .forEach((dc) => {
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
      mainboardCount >= 60 &&
      mainboardCount <= 100 &&
      duplicateIssues.length === 0;

    return {
      mainboardCount,
      sideboardCount,
      duplicateIssues,
      isValid,
    };
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background py-8">
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
  const mainboardCards = deck.cards.filter((dc) => dc.isMainboard);
  const sideboardCards = deck.cards.filter((dc) => !dc.isMainboard);

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
      return;
    }

    try {
      const response = await fetch(`/api/decks/${deckId}/cards`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId }),
      });

      if (response.ok) {
        toast.success("Carte retirée du deck");
        await fetchDeck();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error removing card:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Transformer les cartes pour le CardGrid
  const mainboardMTGCards = mainboardCards.map(transformDeckCardToMTGCard);
  const sideboardMTGCards = sideboardCards.map(transformDeckCardToMTGCard);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className=" mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/decks">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux decks
              </Button>
            </Link>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                  <Layers className="h-10 w-10 text-purple-600" />
                  {deck.name}
                </h1>
                {deck.description && (
                  <p className="text-muted-foreground text-lg mb-3">
                    {deck.description}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize text-base">
                    {deck.format}
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
                        {deckStatus.mainboardCount} cartes mainboard
                        {deckStatus.sideboardCount > 0 &&
                          ` + ${deckStatus.sideboardCount} sideboard`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Link href="/cards">
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Ajouter des cartes
                </Button>
              </Link>
            </div>
          </div>

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
                      {deckStatus.mainboardCount < 60 && (
                        <li>
                          • Minimum 60 cartes requises (actuellement{" "}
                          {deckStatus.mainboardCount})
                        </li>
                      )}
                      {deckStatus.mainboardCount > 100 && (
                        <li>
                          • Maximum 100 cartes autorisées (actuellement{" "}
                          {deckStatus.mainboardCount})
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

          {/* Mainboard */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Mainboard ({deckStatus?.mainboardCount || 0})
            </h2>
            <CardGrid
              cards={mainboardMTGCards}
              context="deck"
              showActions={true}
              onCardRemove={handleRemoveCard}
              emptyMessage="Aucune carte dans le mainboard"
              emptyDescription="Ajoutez des cartes depuis la recherche."
            />
          </div>

          {/* Sideboard */}
          {sideboardCards.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Sideboard ({deckStatus?.sideboardCount || 0})
              </h2>
              <CardGrid
                cards={sideboardMTGCards}
                context="deck"
                showActions={true}
                onCardRemove={handleRemoveCard}
              />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
