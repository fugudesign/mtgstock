"use client";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { DeckSelector } from "@/components/DeckSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MTGCard } from "@/lib/scryfall-api";
import { ArrowLeft, BookOpen, Layers, Package, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated" && resolvedParams) {
      fetchCollection();
    }
  }, [status, router, resolvedParams]);

  const fetchCollection = async () => {
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
  };

  const handleRemoveCard = async (cardId: string) => {
    if (!resolvedParams || !confirm("Retirer cette carte de la collection ?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/collections/${resolvedParams.id}/cards?cardId=${cardId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Refresh collection
        fetchCollection();
      }
    } catch (error) {
      console.error("Error removing card:", error);
    }
  };

  const getTotalCards = () => {
    if (!collection) return 0;
    return collection.cards.reduce((sum, card) => sum + card.quantity, 0);
  };

  const getConditionLabel = (condition: string) => {
    const labels: { [key: string]: string } = {
      nm: "Near Mint",
      lp: "Lightly Played",
      mp: "Moderately Played",
      hp: "Heavily Played",
      dmg: "Damaged",
    };
    return labels[condition] || condition;
  };

  if (status === "loading" || loading || !resolvedParams) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4">
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
        <div className="max-w-7xl mx-auto px-4">
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
        <div className="max-w-7xl mx-auto px-4">
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
                <Card
                  key={collectionCard.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <Link href={`/cards/${collectionCard.card.id}`}>
                    <div className="relative aspect-[5/7] bg-gray-100 cursor-pointer">
                      {collectionCard.card.imageUrl ? (
                        <Image
                          src={collectionCard.card.imageUrl}
                          alt={collectionCard.card.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                      {collectionCard.quantity > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded-full text-sm font-bold">
                          x{collectionCard.quantity}
                        </div>
                      )}
                      {collectionCard.foil && (
                        <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold">
                          FOIL
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardHeader className="pb-3">
                    <Link href={`/cards/${collectionCard.card.id}`}>
                      <CardTitle className="text-lg line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer">
                        {collectionCard.card.name}
                      </CardTitle>
                    </Link>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm text-gray-600">
                      {collectionCard.card.setName && (
                        <div>{collectionCard.card.setName}</div>
                      )}
                      {collectionCard.card.rarity && (
                        <Badge variant="outline" className="text-xs">
                          {collectionCard.card.rarity}
                        </Badge>
                      )}
                      <div className="text-xs">
                        Condition: {getConditionLabel(collectionCard.condition)}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.preventDefault();
                          // Convertir la carte de collection en MTGCard pour DeckSelector
                          const mtgCard: MTGCard = {
                            id: collectionCard.card.id,
                            name: collectionCard.card.name,
                            type_line: collectionCard.card.type || "",
                            mana_cost: collectionCard.card.manaCost || "",
                            image_uris: collectionCard.card.imageUrl
                              ? {
                                  normal: collectionCard.card.imageUrl,
                                  small: collectionCard.card.imageUrl,
                                  png: collectionCard.card.imageUrl,
                                  large: collectionCard.card.imageUrl,
                                  art_crop: collectionCard.card.imageUrl,
                                  border_crop: collectionCard.card.imageUrl,
                                }
                              : undefined,
                            set_name: collectionCard.card.setName || "",
                            rarity: collectionCard.card.rarity || "",
                          } as MTGCard;
                          setSelectedCard(mtgCard);
                          setShowDeckSelector(true);
                        }}
                      >
                        <Layers className="h-4 w-4 mr-2" />
                        Deck
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemoveCard(collectionCard.card.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Retirer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
