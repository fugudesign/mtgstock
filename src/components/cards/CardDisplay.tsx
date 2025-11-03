"use client";

import { CardQuickView } from "@/components/cards/CardQuickView";
import { CollectionDropdown } from "@/components/cards/CollectionDropdown";
import { DeckDropdown } from "@/components/cards/DeckDropdown";
import { ManaSymbols } from "@/components/ManaSymbol";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { BookOpen, Eye, Layers, Trash2 } from "lucide-react";
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

  // État pour l'overlay mobile
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // État pour le Quick View (contexte search uniquement)
  const [showQuickView, setShowQuickView] = useState(false);

  // État pour l'AlertDialog de suppression
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getImageUrl = () => {
    if (imageError) {
      return "/placeholder-card.svg";
    }
    return getCardImageUrl(card);
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case "common":
        return "bg-gray-600";
      case "uncommon":
        return "bg-green-600";
      case "rare":
        return "bg-blue-600";
      case "mythic":
        return "bg-orange-600";
      default:
        return "bg-gray-600";
    }
  };

  const handleViewCard = () => {
    router.push(`/cards/${card.id}`);
  };

  // Handler pour le clic sur la carte (mobile/desktop)
  const handleCardClick = (e: React.MouseEvent) => {
    // Ne rien faire si on clique directement sur un bouton (vérifier la cible)
    const target = e.target as HTMLElement;
    if (target.closest("button")) {
      return;
    }

    e.stopPropagation();

    // Contexte search : ouvrir le Quick View
    if (context === "search") {
      setShowQuickView(true);
      return;
    }

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

  const handleRemoveCard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Ouvrir l'AlertDialog de confirmation
    setShowDeleteAlert(true);
  };

  const handleConfirmDelete = async () => {
    if (onRemove) {
      setIsDeleting(true);
      try {
        await onRemove();
        // Fermer l'overlay mobile et l'alert après suppression réussie
        setShowMobileOverlay(false);
        setShowDeleteAlert(false);
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
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
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
            <Badge
              size="sm"
              className="absolute top-2 left-2 bg-yellow-600 text-black border-0 font-bold mt-10"
            >
              FOIL
            </Badge>
          )}

          {/* Badge condition */}
          {condition && condition !== "nm" && (
            <Badge
              size="sm"
              className="absolute top-2 left-2 bg-orange-600 text-white border-0"
            >
              {condition.toUpperCase()}
            </Badge>
          )}

          {/* Overlay avec les actions - Uniquement pour collection/deck */}
          {showActions && context !== "search" && (
            <div
              // Empêcher la propagation des interactions depuis l'overlay vers la Card parent
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className={`absolute inset-0 bg-black/50 transition-all duration-200 flex items-center justify-center ${
                showMobileOverlay
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto"
              }`}
            >
              <div className="flex gap-2">
                <div className="relative group/tooltip">
                  <Button
                    size="icon"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewCard();
                    }}
                    className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
                  >
                    <Eye />
                  </Button>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Voir les détails
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>

                {status === "authenticated" && (
                  <CollectionDropdown
                    card={card}
                    onSuccess={
                      onAddToCollection
                        ? () => onAddToCollection(card)
                        : undefined
                    }
                  >
                    <div className="relative group/tooltip">
                      <Button
                        size="icon"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="rounded-full bg-pink-600 hover:bg-pink-700 shadow-lg"
                      >
                        <BookOpen />
                      </Button>
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Ajouter à une collection
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </CollectionDropdown>
                )}

                {status === "authenticated" && (
                  <DeckDropdown
                    card={card}
                    onSuccess={
                      onAddToDeck ? () => onAddToDeck(card) : undefined
                    }
                  >
                    <div className="relative group/tooltip">
                      <Button
                        size="icon"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg"
                      >
                        <Layers />
                      </Button>
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Ajouter à un deck
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </DeckDropdown>
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
                  : "opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto"
              }`}
            >
              <div className="flex gap-2">
                <div className="relative group/tooltip">
                  <Button
                    size="icon"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewCard();
                    }}
                    className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
                  >
                    <Eye />
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
                    className="rounded-full bg-red-600 hover:bg-red-700 shadow-lg"
                  >
                    <Trash2 />
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
        </div>

        <CardContent className="p-3 relative">
          <div className="flex gap-2 items-center justify-end w-full absolute top-0 right-2 -translate-y-1/2">
            {/* Badge pour cartes double-face */}
            {isDoubleFacedCard(card) && (
              <Badge
                size="sm"
                className="bg-neutral-700 text-neutral-400 border-0 flex items-center gap-1"
              >
                2 faces
              </Badge>
            )}
            {/* Badge de rareté */}
            {card.rarity && (
              <Badge
                size="sm"
                className={cn(
                  "text-white border-0 capitalize",
                  getRarityColor(card.rarity)
                )}
              >
                {card.rarity}
              </Badge>
            )}
          </div>
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

            {/* Prix indicatif (recherche seulement) */}
            {context === "search" &&
              card.prices &&
              (() => {
                const eurPrice =
                  card.prices.eur && card.prices.eur !== "null"
                    ? parseFloat(card.prices.eur)
                    : null;
                const eurFoilPrice =
                  card.prices.eur_foil && card.prices.eur_foil !== "null"
                    ? parseFloat(card.prices.eur_foil)
                    : null;
                const usdPrice =
                  card.prices.usd && card.prices.usd !== "null"
                    ? parseFloat(card.prices.usd)
                    : null;
                const usdFoilPrice =
                  card.prices.usd_foil && card.prices.usd_foil !== "null"
                    ? parseFloat(card.prices.usd_foil)
                    : null;

                // Ne rien afficher si aucun prix n'est disponible
                if (!eurPrice && !usdPrice && !eurFoilPrice && !usdFoilPrice) {
                  return null;
                }

                return (
                  <div className="pt-1 border-t border-muted">
                    {eurPrice && eurPrice > 0 ? (
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {eurPrice.toFixed(2)} €
                        {eurFoilPrice && eurFoilPrice > 0 && (
                          <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                            Foil: {eurFoilPrice.toFixed(2)} €
                          </span>
                        )}
                      </p>
                    ) : usdPrice && usdPrice > 0 ? (
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        ${usdPrice.toFixed(2)}
                        {usdFoilPrice && usdFoilPrice > 0 && (
                          <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                            Foil: ${usdFoilPrice.toFixed(2)}
                          </span>
                        )}
                      </p>
                    ) : null}
                  </div>
                );
              })()}
          </div>
        </CardContent>
      </Card>

      {/* AlertDialog de confirmation de suppression */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer la carte</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer{" "}
              <strong>&ldquo;{card.name}&rdquo;</strong>{" "}
              {context === "collection" ? "de la collection" : "du deck"} ?
              <br />
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Retirer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick View pour contexte search */}
      {context === "search" && (
        <CardQuickView
          card={showQuickView ? card : null}
          open={showQuickView}
          onOpenChange={setShowQuickView}
        />
      )}
    </>
  );
}
