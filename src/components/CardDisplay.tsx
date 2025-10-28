"use client";

import { DeckSelector } from "@/components/DeckSelector";
import { ManaSymbols } from "@/components/ManaSymbol";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MTGCard,
  getCardImageUrl,
  getCardManaCost,
  getCardType,
  isDoubleFacedCard,
} from "@/lib/scryfall-api";
import { Eye, Heart, Layers } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CardDisplayProps {
  card: MTGCard;
  onAddToCollection?: (card: MTGCard) => void;
  onAddToDeck?: (card: MTGCard) => void;
  showActions?: boolean;
}

interface Collection {
  id: string;
  name: string;
}

export function CardDisplay({
  card,
  onAddToCollection,
  onAddToDeck,
  showActions = true,
}: CardDisplayProps) {
  const { status } = useSession();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [showDeckSelector, setShowDeckSelector] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCollections();
    }
  }, [status]);

  const fetchCollections = async () => {
    try {
      const response = await fetch("/api/collections");
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    setAdding(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardData: card,
          quantity: 1,
          foil: false,
          condition: "nm",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowCollectionMenu(false);
        if (onAddToCollection) {
          onAddToCollection(card);
        }
      }
    } catch (error) {
      console.error("Error adding card to collection:", error);
      toast.error("Erreur lors de l'ajout de la carte");
    } finally {
      setAdding(false);
    }
  };

  const getImageUrl = () => {
    if (imageError) {
      return "/placeholder-card.svg";
    }
    return getCardImageUrl(card);
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case "common":
        return "bg-gray-500";
      case "uncommon":
        return "bg-green-500";
      case "rare":
        return "bg-yellow-500";
      case "mythic rare":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <Card className="relative group overflow-hidden transition-all duration-200 hover:shadow-lg">
      {/* Menu collections en dehors du hover */}
      {showCollectionMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowCollectionMenu(false)}
          />
          <div className="absolute top-12 right-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[200px]">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
              Ajouter à une collection
            </div>
            {collections.length > 0 ? (
              collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleAddToCollection(collection.id)}
                  disabled={adding}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 disabled:opacity-50 text-gray-900"
                >
                  {collection.name}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                Aucune collection
              </div>
            )}
          </div>
        </>
      )}

      <div className="relative">
        <div className="aspect-5/7 overflow-hidden bg-gray-100">
          <Image
            src={getImageUrl()}
            alt={card.name}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Overlay avec les actions */}
        {showActions && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
            <div className="flex gap-3">
              <div className="relative group/tooltip">
                <Button
                  size="icon"
                  variant="default"
                  onClick={() => router.push(`/cards/${card.id}`)}
                  className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
                >
                  <Eye className="h-5 w-5" />
                </Button>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Voir les détails
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>

              {status === "authenticated" && (
                <div className="relative group/tooltip">
                  <Button
                    size="icon"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCollectionMenu(!showCollectionMenu);
                    }}
                    className="h-12 w-12 rounded-full bg-pink-600 hover:bg-pink-700 shadow-lg"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Ajouter à une collection
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}

              {status === "authenticated" && (
                <div className="relative group/tooltip">
                  <Button
                    size="icon"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeckSelector(true);
                    }}
                    className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg"
                  >
                    <Layers className="h-5 w-5" />
                  </Button>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Ajouter à un deck
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Badge de rareté */}
        {card.rarity && (
          <Badge
            className={`absolute top-2 right-2 ${getRarityColor(
              card.rarity
            )} text-white border-0`}
          >
            {card.rarity}
          </Badge>
        )}

        {/* Badge pour cartes double-face */}
        {isDoubleFacedCard(card) && (
          <Badge className="absolute top-2 left-2 bg-purple-600 text-white border-0 flex items-center gap-1">
            <Layers className="h-3 w-3" />
            Double face
          </Badge>
        )}
      </div>

      <CardContent className="p-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {card.name}
          </h3>

          {getCardManaCost(card) && (
            <div className="flex items-center gap-1">
              <ManaSymbols manaCost={getCardManaCost(card)} size={16} />
            </div>
          )}

          {getCardType(card) && (
            <p className="text-xs text-gray-600 line-clamp-1">
              {getCardType(card)}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{card.set_name || card.set}</span>
            {card.cmc !== undefined && <span>CMC: {card.cmc}</span>}
          </div>
        </div>
      </CardContent>

      {/* Deck Selector Modal */}
      <DeckSelector
        card={card}
        isOpen={showDeckSelector}
        onClose={() => setShowDeckSelector(false)}
        onSuccess={() => {
          if (onAddToDeck) {
            onAddToDeck(card);
          }
        }}
      />
    </Card>
  );
}
