"use client";

import { ManaSymbols } from "@/components/ManaSymbol";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Info,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated" && deckId) {
      fetchDeck();
    }
  }, [status, deckId, router]);

  const fetchDeck = async () => {
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
  };

  const handleRemoveCard = async (cardId: string) => {
    if (!confirm("Voulez-vous vraiment retirer cette carte du deck ?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/decks/${deckId}/cards?cardId=${cardId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Carte retirée du deck");
        fetchDeck();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error removing card:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 bg-gray-200 rounded"></div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/decks">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux decks
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <Layers className="h-10 w-10 text-purple-600" />
                {deck.name}
              </h1>
              {deck.description && (
                <p className="text-slate-600 text-lg mb-3">
                  {deck.description}
                </p>
              )}
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="capitalize text-base">
                  {deck.format}
                </Badge>
                {deckStatus && (
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded border ${
                      deckStatus.isValid
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-red-100 text-red-700 border-red-300"
                    }`}
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
          <Card className="mb-6 border-orange-300 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">
                    Ce deck n’est pas encore valide.
                  </h3>
                  <ul className="space-y-1 text-sm text-orange-800">
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
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Mainboard ({deckStatus?.mainboardCount || 0})
          </h2>
          {mainboardCards.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mainboardCards.map((deckCard) => (
                <Card
                  key={deckCard.id}
                  className="group relative overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <Link href={`/cards/${deckCard.card.id}`}>
                    <div className="relative aspect-[5/7] bg-gray-100">
                      {deckCard.card.imageUrl ? (
                        <Image
                          src={deckCard.card.imageUrl}
                          alt={deckCard.card.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-xs text-center p-2">
                            Image non disponible
                          </span>
                        </div>
                      )}
                      {deckCard.quantity > 1 && (
                        <div className="absolute top-2 right-2 bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                          {deckCard.quantity}
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-2">
                    <p className="text-xs font-semibold truncate">
                      {deckCard.card.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <ManaSymbols
                        manaCost={deckCard.card.manaCost || ""}
                        size={14}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCard(deckCard.cardId)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  Aucune carte dans le mainboard. Ajoutez des cartes depuis la
                  recherche.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sideboard */}
        {sideboardCards.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Sideboard ({deckStatus?.sideboardCount || 0})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sideboardCards.map((deckCard) => (
                <Card
                  key={deckCard.id}
                  className="group relative overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <Link href={`/cards/${deckCard.card.id}`}>
                    <div className="relative aspect-[5/7] bg-gray-100">
                      {deckCard.card.imageUrl ? (
                        <Image
                          src={deckCard.card.imageUrl}
                          alt={deckCard.card.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-xs text-center p-2">
                            Image non disponible
                          </span>
                        </div>
                      )}
                      {deckCard.quantity > 1 && (
                        <div className="absolute top-2 right-2 bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                          {deckCard.quantity}
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-2">
                    <p className="text-xs font-semibold truncate">
                      {deckCard.card.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <ManaSymbols
                        manaCost={deckCard.card.manaCost || ""}
                        size={14}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCard(deckCard.cardId)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
