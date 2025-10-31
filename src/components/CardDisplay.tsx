"use client";

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
import { cn } from "@/lib/utils";
import { BookOpen, Eye, Layers, Loader2, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface CardDisplayProps {
  card: MTGCard;
  onAddToCollection?: (card: MTGCard) => void;
  onAddToDeck?: (card: MTGCard) => void;
  showActions?: boolean;
  // Nouvelles props pour collection/deck
  quantity?: number;
  foil?: boolean;
  condition?: string;
  onRemove?: () => void;
  context?: "search" | "collection" | "deck";
}

interface Collection {
  id: string;
  name: string;
}

interface Deck {
  id: string;
  name: string;
  format: string;
  cardCount: number;
}

export function CardDisplay({
  card,
  onAddToCollection,
  onAddToDeck,
  showActions = true,
  quantity,
  foil,
  condition,
  onRemove,
  context = "search",
}: CardDisplayProps) {
  const { status } = useSession();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [showDeckMenu, setShowDeckMenu] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [adding, setAdding] = useState(false);
  const [collectionMenuPosition, setCollectionMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const [deckMenuPosition, setDeckMenuPosition] = useState({ top: 0, left: 0 });
  const collectionButtonRef = useRef<HTMLButtonElement>(null);
  const deckButtonRef = useRef<HTMLButtonElement>(null);

  // État pour l'overlay mobile
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCollections();
      fetchDecks();
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

  const fetchDecks = async () => {
    try {
      const response = await fetch("/api/decks");
      if (response.ok) {
        const data = await response.json();
        setDecks(data);
      }
    } catch (error) {
      console.error("Error fetching decks:", error);
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

  const handleAddToDeck = async (deckId: string) => {
    setAdding(true);
    try {
      const response = await fetch(`/api/decks/${deckId}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardData: card,
          quantity: 1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowDeckMenu(false);
        if (onAddToDeck) {
          onAddToDeck(card);
        }
      }
    } catch (error) {
      console.error("Error adding card to deck:", error);
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
        return "bg-blue-500";
      case "mythic":
        return "bg-orange-500";
      default:
        return "bg-gray-400";
    }
  };

  const handleCloseCollectionMenu = () => {
    setShowCollectionMenu(false);
  };

  const handleCloseDeckMenu = () => {
    setShowDeckMenu(false);
  };

  const handleViewCard = () => {
    router.push(`/cards/${card.id}`);
  };

  // Handler pour le clic sur la carte (mobile/desktop)
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Détecter si on est sur mobile (approximatif mais suffisant)
    const isMobile = window.innerWidth < 768;

    if (isMobile && showActions) {
      // Sur mobile : toggle l'overlay des actions
      setShowMobileOverlay(!showMobileOverlay);
    } else {
      // Sur desktop : navigation directe
      handleViewCard();
    }
  };

  // Fermer l'overlay mobile quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showMobileOverlay &&
        cardRef.current &&
        !cardRef.current.contains(event.target as Node)
      ) {
        setShowMobileOverlay(false);
      }
    };

    if (showMobileOverlay) {
      // Ajouter un petit délai pour éviter que le clic qui ouvre ferme immédiatement
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 100);

      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [showMobileOverlay]);

  const handleToggleCollectionMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (collectionButtonRef.current) {
      const rect = collectionButtonRef.current.getBoundingClientRect();
      const menuWidth = 200;
      const menuHeight = 200;

      let top = rect.bottom + 8;
      let left = rect.left;

      if (left + menuWidth > window.innerWidth) {
        left = rect.right - menuWidth;
      }

      if (top + menuHeight > window.innerHeight && rect.top > menuHeight) {
        top = rect.top - menuHeight - 8;
      }

      setCollectionMenuPosition({ top, left });
    }
    setShowCollectionMenu(!showCollectionMenu);
  };

  const handleToggleDeckMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deckButtonRef.current) {
      const rect = deckButtonRef.current.getBoundingClientRect();
      const menuWidth = 240;
      const menuHeight = 300;

      let top = rect.bottom + 8;
      let left = rect.left;

      if (left + menuWidth > window.innerWidth) {
        left = rect.right - menuWidth;
      }

      if (top + menuHeight > window.innerHeight && rect.top > menuHeight) {
        top = rect.top - menuHeight - 8;
      }

      setDeckMenuPosition({ top, left });
    }
    setShowDeckMenu(!showDeckMenu);
  };

  const handleRemoveCard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      try {
        await onRemove();
        // Fermer l'overlay mobile après suppression réussie
        setShowMobileOverlay(false);
        toast.success(
          `Carte retirée ${
            context === "collection" ? "de la collection" : "du deck"
          }`
        );
      } catch (error) {
        console.error("Error removing card:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";

        // Ne pas afficher d'erreur si l'utilisateur a annulé
        if (!errorMessage.includes("annulée par l'utilisateur")) {
          toast.error("Erreur lors de la suppression de la carte");
        }
      }
    }
  };

  return (
    <>
      {/* Menu collections - en dehors de la Card */}
      {showCollectionMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleCloseCollectionMenu}
          />
          <div
            className="fixed bg-card border border-border rounded-lg shadow-xl py-1 z-50 min-w-[200px]"
            style={{
              top: `${collectionMenuPosition.top}px`,
              left: `${collectionMenuPosition.left}px`,
            }}
          >
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
              Ajouter à une collection
            </div>
            {collections.length > 0 ? (
              collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleAddToCollection(collection.id)}
                  disabled={adding}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-accent disabled:opacity-50 text-foreground transition-colors flex items-center justify-between"
                >
                  <span>{collection.name}</span>
                  {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Aucune collection
              </div>
            )}
          </div>
        </>
      )}

      {/* Menu decks - en dehors de la Card */}
      {showDeckMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleCloseDeckMenu} />
          <div
            className="fixed bg-card border border-border rounded-lg shadow-xl py-1 z-50 min-w-60 max-h-96 overflow-y-auto"
            style={{
              top: `${deckMenuPosition.top}px`,
              left: `${deckMenuPosition.left}px`,
            }}
          >
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
              Ajouter à un deck
            </div>
            {decks.length > 0 ? (
              decks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => handleAddToDeck(deck.id)}
                  disabled={adding}
                  className="w-full px-3 py-2 text-left hover:bg-accent disabled:opacity-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">
                        {deck.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {deck.format} • {deck.cardCount} cartes
                      </div>
                    </div>
                    {adding && (
                      <Loader2 className="h-4 w-4 animate-spin ml-2 shrink-0" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Aucun deck
              </div>
            )}
          </div>
        </>
      )}

      <Card
        ref={cardRef}
        className="relative group overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative overflow-hidden">
          <div className="aspect-5/7 bg-muted ">
            <Image
              src={getImageUrl()}
              alt={card.name}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>

          {/* Badge quantité (pour collection/deck) */}
          {quantity && quantity > 1 && (
            <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded-full text-sm font-bold">
              x{quantity}
            </div>
          )}

          {/* Badge foil */}
          {foil && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-black border-0 font-bold mt-10">
              FOIL
            </Badge>
          )}

          {/* Badge condition */}
          {condition && condition !== "nm" && (
            <Badge className="absolute top-2 left-2 bg-orange-500 text-white border-0 mt-20">
              {condition.toUpperCase()}
            </Badge>
          )}

          {/* Overlay avec les actions - Desktop au hover, Mobile au tap */}
          {showActions && context === "search" && (
            <div
              // Empêcher la propagation des interactions depuis l'overlay vers la Card parent
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className={`absolute inset-0 bg-black/50 transition-all duration-200 flex items-center justify-center ${
                showMobileOverlay
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 md:group-hover:opacity-100 pointer-events-none md:pointer-events-auto"
              }`}
            >
              <div className="flex gap-3">
                <div className="relative group/tooltip">
                  <Button
                    size="icon"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewCard();
                    }}
                    className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg pointer-events-auto"
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
                      ref={collectionButtonRef}
                      size="icon"
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCollectionMenu(e);
                      }}
                      className="h-12 w-12 rounded-full bg-pink-600 hover:bg-pink-700 shadow-lg pointer-events-auto"
                    >
                      <BookOpen className="h-5 w-5" />
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
                      ref={deckButtonRef}
                      size="icon"
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleDeckMenu(e);
                      }}
                      className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg pointer-events-auto"
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

          {/* Actions pour collection/deck - Desktop au hover, Mobile au tap */}
          {onRemove && (context === "collection" || context === "deck") && (
            <div
              // Empêcher la propagation des interactions depuis l'overlay vers la Card parent
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className={`absolute inset-0 bg-black/50 transition-all duration-200 flex items-center justify-center ${
                showMobileOverlay
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 md:group-hover:opacity-100 pointer-events-none md:pointer-events-auto"
              }`}
            >
              <div className="flex gap-3">
                <div className="relative group/tooltip">
                  <Button
                    size="icon"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewCard();
                    }}
                    className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg pointer-events-auto"
                  >
                    <Eye className="h-5 w-5" />
                  </Button>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Voir les détails
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>

                <div className="relative group/tooltip">
                  <Button
                    size="icon"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCard(e);
                    }}
                    className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 shadow-lg pointer-events-auto"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Retirer{" "}
                    {context === "collection" ? "de la collection" : "du deck"}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Badge de rareté */}
          {card.rarity && (
            <Badge
              className={cn(
                "absolute top-2 right-2 text-white border-0",
                getRarityColor(card.rarity)
              )}
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
              {card.printed_name || card.name}
            </h3>

            {getCardManaCost(card) && (
              <div className="flex items-center gap-1">
                <ManaSymbols manaCost={getCardManaCost(card)} size={16} />
              </div>
            )}

            {getCardType(card) && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {card.printed_type_line || getCardType(card)}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{card.set_name || card.set}</span>
              {card.cmc !== undefined && <span>CMC: {card.cmc}</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
