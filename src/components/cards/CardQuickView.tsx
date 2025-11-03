"use client";

import { ManaSymbols, ManaText } from "@/components/ManaSymbol";
import { CollectionDropdown } from "@/components/cards/CollectionDropdown";
import { DeckDropdown } from "@/components/cards/DeckDropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useMediaQuery } from "@/hooks";
import { priceCache } from "@/lib/price-cache";
import {
  MTGCard,
  getCardImageUrl,
  getCardManaCost,
  getCardType,
  mtgApiService,
} from "@/lib/scryfall-api";
import { cn } from "@/lib/utils";
import { BookOpen, ExternalLink, Layers, Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface CardQuickViewProps {
  card: MTGCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardQuickView({
  card,
  open,
  onOpenChange,
}: CardQuickViewProps) {
  const [enrichedPrices, setEnrichedPrices] = useState<
    MTGCard["prices"] | null
  >(null);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Enrichir avec les prix anglais pour les cartes non-anglaises
  useEffect(() => {
    if (!open || !card) return;

    // Reset l'état des prix
    setEnrichedPrices(null);
    setLoadingPrices(false);

    // Si la carte est déjà en anglais, pas besoin d'enrichir
    if (card.lang === "en" || !card.oracle_id) {
      setEnrichedPrices(card.prices || null);
      return;
    }

    // Enrichir avec les prix pour cartes non-anglaises
    const enrichWithPrices = async () => {
      // Vérifier le cache d'abord
      const cachedPrices = priceCache.get(card.id);

      if (cachedPrices) {
        setEnrichedPrices(cachedPrices);
        return;
      }

      // Sinon, appeler l'API
      setLoadingPrices(true);
      try {
        const enriched = await mtgApiService.enrichWithEnglishPrices(card);

        // Stocker dans le cache
        if (enriched.prices) {
          priceCache.set(card.id, enriched.prices);
          setEnrichedPrices(enriched.prices);
        }
      } catch (error) {
        console.error("Erreur lors de l'enrichissement des prix:", error);
      } finally {
        setLoadingPrices(false);
      }
    };

    enrichWithPrices();
  }, [card, open]);

  if (!card) return null;

  // Utiliser les prix enrichis si disponibles, sinon les prix originaux
  const displayCard = {
    ...card,
    prices: enrichedPrices || card.prices,
  };

  const imageUrl = getCardImageUrl(displayCard);
  const manaCost = getCardManaCost(displayCard);
  const typeText = getCardType(displayCard);

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "common":
        return "bg-gray-500";
      case "uncommon":
        return "bg-gray-400";
      case "rare":
        return "bg-yellow-600";
      case "mythic":
        return "bg-orange-600";
      default:
        return "bg-gray-500";
    }
  };

  const formatPrice = (price: string | null | undefined) => {
    if (!price || price === "null") return null;
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) return null;
    return numPrice.toFixed(2);
  };

  const eurPrice = formatPrice(displayCard.prices?.eur);
  const usdPrice = formatPrice(displayCard.prices?.usd);

  return (
    <ResponsiveDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={card.printed_name || card.name}
      description={card.set_name}
      // Desktop: Dialog très large et haut (force avec !important), Mobile: Drawer quasi fullscreen
      desktopClassName="!max-w-7xl !w-[95vw] !h-[90vh] overflow-hidden flex flex-col"
      mobileClassName="!h-[95vh] !max-h-[95vh] overflow-hidden"
    >
      {/* Layout adaptatif : 1/3 image + 2/3 infos desktop, stack mobile */}
      <div
        className={cn(
          "overflow-y-auto flex-1 min-h-0",
          isDesktop ? "grid grid-cols-3 gap-6 p-2" : "space-y-4 pb-4"
        )}
      >
        {/* Colonne 1 : Image de la carte + boutons (desktop uniquement) */}
        <div className="relative flex flex-col gap-4">
          <div
            className={cn(
              "sticky top-0 space-y-4",
              isDesktop ? "w-full" : "flex items-center justify-center"
            )}
          >
            <Image
              src={imageUrl}
              alt={card.printed_name || card.name}
              width={488}
              height={680}
              className="rounded-lg w-full h-auto shadow-xl"
              priority
            />
            {/* Badge de rareté */}
            {card.rarity && (
              <Badge
                className={cn(
                  "absolute top-2 right-2 text-white border-0 capitalize",
                  getRarityColor(card.rarity)
                )}
              >
                {card.rarity}
              </Badge>
            )}
          </div>
        </div>

        {/* Colonne 2 : Informations détaillées (col-span-2 desktop) */}
        <div className={cn("space-y-4 pb-4", isDesktop && "col-span-2")}>
          {/* Coût de mana */}
          {manaCost && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Coût :
              </span>
              <ManaSymbols manaCost={manaCost} size={20} />
            </div>
          )}

          {/* Type */}
          {typeText && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Type :{" "}
              </span>
              <span className="text-sm">
                {card.printed_type_line || typeText}
              </span>
            </div>
          )}

          {/* Texte d'oracle */}
          {(card.printed_text || card.oracle_text) && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Texte :
              </span>
              <div className="text-sm mt-1">
                <ManaText
                  text={card.printed_text || card.oracle_text || ""}
                  symbolSize={16}
                  className="whitespace-pre-wrap"
                />
              </div>
            </div>
          )}

          {/* Force/Endurance ou Loyauté */}
          {card.power && card.toughness && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Force/Endurance :{" "}
              </span>
              <span className="text-sm">
                {card.power}/{card.toughness}
              </span>
            </div>
          )}

          {card.loyalty && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Loyauté :{" "}
              </span>
              <span className="text-sm">{card.loyalty}</span>
            </div>
          )}

          {/* Prix */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Prix indicatifs</span>
              {loadingPrices && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {!loadingPrices && (eurPrice || usdPrice) ? (
              <div className="flex gap-3">
                {eurPrice && (
                  <Badge variant="secondary" className="text-base">
                    {eurPrice} €
                  </Badge>
                )}
                {usdPrice && (
                  <Badge variant="secondary" className="text-base">
                    ${usdPrice}
                  </Badge>
                )}
              </div>
            ) : !loadingPrices ? (
              <p className="text-xs text-muted-foreground">
                Prix non disponible
              </p>
            ) : null}

            {card.lang !== "en" && !loadingPrices && (
              <p className="text-xs text-muted-foreground italic">
                Prix de la version anglaise
              </p>
            )}
          </div>

          {/* Artiste et set */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            {card.artist && <span>Illustré par {card.artist}</span>}
            <span>
              {card.set.toUpperCase()} #{card.collector_number}
            </span>
          </div>

          {/* Actions */}
          <div
            className={cn("flex flex-col gap-2 pt-4", {
              "flex-row gap-4": isDesktop,
            })}
          >
            <CollectionDropdown card={card}>
              <Button variant="default" className="w-full">
                <BookOpen className="mr-2 h-4 w-4" />
                Ajouter à une collection
              </Button>
            </CollectionDropdown>

            <DeckDropdown card={card}>
              <Button variant="default" className="w-full">
                <Layers className="mr-2 h-4 w-4" />
                Ajouter à un deck
              </Button>
            </DeckDropdown>

            <Button
              onClick={() => window.open(card.scryfall_uri, "_blank")}
              className="w-full"
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir sur Scryfall
            </Button>
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
