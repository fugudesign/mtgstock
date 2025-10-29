"use client";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { CardDisplay } from "@/components/CardDisplay";
import { DeckSelector } from "@/components/DeckSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MTGCard } from "@/lib/scryfall-api";
import { ArrowLeft, BookOpen, Package } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface CollectionCard {
  id: string;
  quantity: number;
  foil: boolean;
  condition: string;
  acquiredDate: string;
  card: {
    id: string;
    name: string;
    imageUrl: string | null;
    setName: string | null;
    rarity: string | null;
    manaCost: string | null;
    type: string | null;
  };
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  cards: CollectionCard[];
  _count: {
    cards: number;
  };
}

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
    null
  );
  const [showDeckSelector, setShowDeckSelector] = useState(false);
  const [selectedCard, setSelectedCard] = useState<MTGCard | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const fetchCollection = useCallback(async () => {
    if (!resolvedParams) return;

    try {
      const response = await fetch(`/api/collections/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setCollection(data);
      } else if (response.status === 404) {
        router.push("/collections");
      }
    } catch (error) {
      console.error("Error fetching collection:", error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated" && resolvedParams) {
      fetchCollection();
    }
  }, [status, router, resolvedParams, fetchCollection]);

  const getTotalCards = () => {
    if (!collection) return 0;
    return collection.cards.reduce((sum, card) => sum + card.quantity, 0);
  };

  if (status === "loading" || loading || !resolvedParams) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className=" mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-neutral-800 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-96 bg-neutral-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className=" mx-auto px-4">
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Collection non trouvée
              </h3>
              <Link href="/collections">
                <Button>Retour aux collections</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background py-8">
        <div className=" mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link href="/collections">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux collections
              </Button>
            </Link>

            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-2">
                    {collection.name}
                  </h1>
                  {collection.description && (
                    <p className="text-slate-600 mb-3">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">
                        {getTotalCards()} cartes
                      </span>
                    </div>
                    <Badge
                      variant={collection.isPublic ? "default" : "secondary"}
                    >
                      {collection.isPublic ? "Public" : "Privé"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {collection.cards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {collection.cards.map((collectionCard) => (
                <CardDisplay
                  key={collectionCard.id}
                  card={
                    {
                      id: collectionCard.card.id,
                      name: collectionCard.card.name,
                      image_uris: collectionCard.card.imageUrl
                        ? {
                            small: collectionCard.card.imageUrl,
                            normal: collectionCard.card.imageUrl,
                            large: collectionCard.card.imageUrl,
                            png: collectionCard.card.imageUrl,
                            art_crop: collectionCard.card.imageUrl,
                            border_crop: collectionCard.card.imageUrl,
                          }
                        : undefined,
                      set_name: collectionCard.card.setName || "",
                      rarity: collectionCard.card.rarity || "",
                      mana_cost: collectionCard.card.manaCost || "",
                      type_line: collectionCard.card.type || "",
                      cmc: 0,
                    } as MTGCard
                  }
                  context="collection"
                  quantity={collectionCard.quantity}
                  foil={collectionCard.foil}
                  condition={collectionCard.condition}
                  onRemove={async () => {
                    try {
                      const response = await fetch(
                        `/api/collections/${collection.id}/cards`,
                        {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            cardId: collectionCard.card.id,
                          }),
                        }
                      );
                      if (response.ok) {
                        fetchCollection();
                      }
                    } catch (error) {
                      console.error("Erreur lors de la suppression:", error);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Collection vide
                </h3>
                <p className="text-gray-500 mb-6">
                  Ajoutez des cartes à votre collection depuis la page de
                  recherche
                </p>
                <Link href="/search">
                  <Button>Rechercher des cartes</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Deck Selector Modal */}
          {selectedCard && (
            <DeckSelector
              card={selectedCard}
              isOpen={showDeckSelector}
              onClose={() => {
                setShowDeckSelector(false);
                setSelectedCard(null);
              }}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
