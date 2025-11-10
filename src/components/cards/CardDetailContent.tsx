"use client";

import { ManaSymbols, ManaText } from "@/components/ManaSymbol";
import { PriceTracker } from "@/components/cards/PriceTracker";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks";
import {
  MTGCard,
  getCardFaceImages,
  getCardImageUrl,
  getCardManaCost,
  getCardType,
  isDoubleFacedCard,
} from "@/lib/scryfall-api";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

interface CardDetailContentProps {
  card: MTGCard;
  enrichedPrices?: MTGCard["prices"] | null;
  loadingPrices?: boolean;
}

/**
 * Contenu détaillé d'une carte MTG
 * Composant réutilisable pour CardQuickView et les pages de détail
 */
export function CardDetailContent({
  card,
  enrichedPrices,
  loadingPrices = false,
}: CardDetailContentProps) {
  const { data: session } = useSession();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);

  // Utiliser les prix enrichis si disponibles, sinon les prix originaux
  const displayCard = {
    ...card,
    prices: enrichedPrices || card.prices,
  };

  const imageUrl = getCardImageUrl(displayCard);
  const manaCost = getCardManaCost(displayCard);
  const typeText = getCardType(displayCard);

  const formatPrice = (price: string | null | undefined) => {
    if (!price || price === "null") return null;
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) return null;
    return numPrice.toFixed(2);
  };

  const eurPrice = formatPrice(displayCard.prices?.eur);
  const usdPrice = formatPrice(displayCard.prices?.usd);

  const cardFaces = getCardFaceImages(card);
  const isDoubleFaced = isDoubleFacedCard(card);

  return (
    <div
      className={cn(
        "overflow-y-auto flex-1 min-h-0",
        isDesktop ? "grid grid-cols-4 gap-6" : "space-y-4"
      )}
    >
      {/* Colonne 1 : Image de la carte + Prix */}
      <div className="relative flex flex-col gap-4">
        <div className="sticky top-0 space-y-4">
          <div
            className={cn(
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

            {/* Indicateur et boutons pour les cartes double-face */}
            {isDoubleFaced && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                {cardFaces.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFaceIndex(index)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      currentFaceIndex === index
                        ? "bg-primary text-white shadow-lg"
                        : "bg-white/90 text-gray-700 hover:bg-white"
                    )}
                  >
                    Face {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bloc Prix */}
          {(eurPrice || usdPrice || loadingPrices) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Prix estimés
                  {loadingPrices && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!loadingPrices && (eurPrice || usdPrice) ? (
                  <>
                    {eurPrice && (
                      <Badge
                        variant="secondary"
                        className="w-full flex items-center justify-between rounded-sm"
                      >
                        <span className="text-muted-foreground">Normal</span>
                        <span className="font-semibold">{eurPrice}€</span>
                      </Badge>
                    )}
                    {displayCard.prices?.eur_foil &&
                      formatPrice(displayCard.prices.eur_foil) && (
                        <Badge
                          variant="secondary"
                          className="w-full flex items-center justify-between rounded-sm"
                        >
                          <span className="text-muted-foreground">Foil</span>
                          <span className="font-semibold">
                            {formatPrice(displayCard.prices.eur_foil)}€
                          </span>
                        </Badge>
                      )}
                    {card.lang !== "en" && (
                      <p className="text-xs text-muted-foreground italic pt-2">
                        Prix de la version anglaise
                      </p>
                    )}
                  </>
                ) : !loadingPrices ? (
                  <p className="text-xs text-muted-foreground">
                    Prix non disponible
                  </p>
                ) : null}

                {/* Price Tracker - uniquement si l'utilisateur possède la carte */}
                {session && <PriceTracker cardId={card.id} />}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Colonne 2-4 : Informations détaillées */}
      <div className={cn("space-y-4", isDesktop && "col-span-3")}>
        {/* Bloc principal : infos de la carte */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-2xl">
                {card.printed_name || card.name}
              </CardTitle>
              {manaCost && (
                <div className="flex gap-1 shrink-0">
                  <ManaSymbols manaCost={manaCost} size={20} />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge
                size="sm"
                variant="outline"
                className={cn(
                  "border",
                  card.rarity === "mythic" &&
                    "bg-orange-700/20 text-orange-300 border-orange-700",
                  card.rarity === "rare" &&
                    "bg-yellow-700/20 text-yellow-300 border-yellow-700",
                  card.rarity === "uncommon" &&
                    "bg-gray-400/20 text-gray-300 border-gray-400",
                  card.rarity === "common" &&
                    "bg-gray-600/20 text-gray-400 border-gray-600"
                )}
              >
                {card.rarity === "mythic" && "Mythique"}
                {card.rarity === "rare" && "Rare"}
                {card.rarity === "uncommon" && "Peu commune"}
                {card.rarity === "common" && "Commune"}
                {card.rarity === "special" && "Spéciale"}
                {card.rarity === "bonus" && "Bonus"}
              </Badge>
              {card.lang && (
                <Badge size="sm" variant="outline">
                  {card.lang.toUpperCase()}
                </Badge>
              )}
              {(card.foil || card.nonfoil) && (
                <Badge size="sm" variant="outline">
                  {card.foil && card.nonfoil
                    ? "Foil & Non-foil"
                    : card.foil
                    ? "Foil uniquement"
                    : "Non-foil uniquement"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type */}
            <div>
              <h3 className="font-semibold text-sm text-foreground mb-2">
                Type
              </h3>
              <p className="text-muted-foreground">
                {card.printed_type_line || typeText}
              </p>
            </div>

            {/* Texte d'oracle */}
            {(card.printed_text || card.oracle_text) && (
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-2">
                  Texte d&apos;Oracle
                </h3>
                <ManaText
                  text={card.printed_text || card.oracle_text || ""}
                  symbolSize={16}
                  className="font-serif italic text-muted-foreground whitespace-pre-wrap"
                />
              </div>
            )}

            {/* Texte d'ambiance */}
            {card.flavor_text && (
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-2">
                  Texte d&apos;ambiance
                </h3>
                <p className="text-muted-foreground italic">
                  {card.flavor_text}
                </p>
              </div>
            )}

            <div className="flex justify-end items-center gap-2">
              {/* Force/Endurance */}
              {(card.power || card.toughness) && (
                <Badge variant="secondary">
                  Force / Endurance : {card.power} / {card.toughness}
                </Badge>
              )}

              {/* Loyauté */}
              {card.loyalty && (
                <Badge variant="secondary">Loyauté : {card.loyalty}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bloc Légalités */}
        {card.legalities && (
          <Card>
            <CardHeader>
              <CardTitle>Légalités</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(card.legalities).map(([format, status]) => {
                  if (status === "not_legal") return null;

                  const statusDefinition: {
                    [key: string]: {
                      label: string;
                      variant: BadgeProps["variant"];
                    };
                  } = {
                    legal: { label: "Légal", variant: "successOutline" },
                    banned: { label: "Banni", variant: "destructiveOutline" },
                    restricted: {
                      label: "Restreint",
                      variant: "warningOutline",
                    },
                  };

                  return (
                    <div key={format} className="flex items-center gap-2">
                      <div className="w-18">
                        <Badge
                          size="sm"
                          variant={
                            statusDefinition[status]?.variant || "secondary"
                          }
                        >
                          {statusDefinition[status]?.label || status}
                        </Badge>
                      </div>
                      <div className="font-semibold text-xs uppercase">
                        {format.replace(/_/g, " ")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bloc Mots-clés */}
        {card.keywords && card.keywords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mots-clés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {card.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bloc Informations de l'édition */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de l&apos;édition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">
                  Édition
                </h3>
                <p className="text-muted-foreground">{card.set_name}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">
                  Code de l&apos;édition
                </h3>
                <p className="text-muted-foreground uppercase">{card.set}</p>
              </div>
              {card.collector_number && (
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">
                    Numéro de collection
                  </h3>
                  <p className="text-muted-foreground">
                    {card.collector_number}
                  </p>
                </div>
              )}
              {card.released_at && (
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">
                    Date de sortie
                  </h3>
                  <p className="text-muted-foreground">
                    {new Date(card.released_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              )}
              {card.artist && (
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">
                    Artiste
                  </h3>
                  <p className="text-muted-foreground">{card.artist}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => window.open(card.scryfall_uri, "_blank")}
          className="w-full"
          size={isDesktop ? "default" : "sm"}
          variant="outline"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Voir sur Scryfall
        </Button>
      </div>
    </div>
  );
}
