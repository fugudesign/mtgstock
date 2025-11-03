"use client";

import { ManaSymbols, ManaText } from "@/components/ManaSymbol";
import { CollectionDropdown } from "@/components/cards/CollectionDropdown";
import { DeckDropdown } from "@/components/cards/DeckDropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const formatPrice = (price: string | null | undefined) => {
    if (!price || price === "null") return null;
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) return null;
    return numPrice.toFixed(2);
  };

  const eurPrice = formatPrice(displayCard.prices?.eur);
  const usdPrice = formatPrice(displayCard.prices?.usd);

  // Footer avec les boutons d'action
  const footerActions = (
    <div
      className={cn("flex gap-2 w-full", isDesktop ? "flex-row" : "flex-col")}
    >
      <Button
        onClick={() => window.open(card.scryfall_uri, "_blank")}
        className={cn(isDesktop && "flex-1")}
        variant="outline"
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Voir sur Scryfall
      </Button>

      <CollectionDropdown card={card}>
        <Button variant="default" className={cn(isDesktop && "flex-1")}>
          <BookOpen className="mr-2 h-4 w-4" />
          Ajouter à une collection
        </Button>
      </CollectionDropdown>

      <DeckDropdown card={card}>
        <Button variant="default" className={cn(isDesktop && "flex-1")}>
          <Layers className="mr-2 h-4 w-4" />
          Ajouter à un deck
        </Button>
      </DeckDropdown>
    </div>
  );

  return (
    <ResponsiveDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={card.printed_name || card.name}
      description={card.set_name}
      footer={footerActions}
      // Desktop: Dialog très large et haut (force avec !important), Mobile: Drawer quasi fullscreen
      desktopClassName="!max-w-7xl !w-[95vw] !h-[90vh] overflow-hidden flex flex-col"
      mobileClassName="!h-[95vh] !max-h-[95vh] overflow-hidden"
    >
      {/* Layout adaptatif : 1/3 image + 2/3 infos desktop, stack mobile */}
      <div
        className={cn(
          "overflow-y-auto flex-1 min-h-0",
          isDesktop ? "grid grid-cols-3 gap-6 p-2" : "space-y-4"
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
          </div>
        </div>

        {/* Colonne 2 : Informations détaillées (col-span-2 desktop) */}
        <div className={cn("space-y-4", isDesktop && "col-span-2")}>
          {/* Bloc principal : infos de la carte */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-xl">
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
                  <Badge variant="outline">{card.lang.toUpperCase()}</Badge>
                )}
                {(card.foil || card.nonfoil) && (
                  <Badge variant="outline">
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
                    className="whitespace-pre-wrap"
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

              {/* Force/Endurance */}
              {(card.power || card.toughness) && (
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-2">
                    Force / Endurance
                  </h3>
                  <p className="text-muted-foreground">
                    {card.power} / {card.toughness}
                  </p>
                </div>
              )}

              {/* Loyauté */}
              {card.loyalty && (
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-2">
                    Loyauté
                  </h3>
                  <p className="text-muted-foreground">{card.loyalty}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bloc Prix */}
          {(eurPrice || usdPrice || loadingPrices) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Prix
                  {loadingPrices && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!loadingPrices && (eurPrice || usdPrice) ? (
                  <>
                    {eurPrice && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Normal:</span>
                        <span className="font-semibold">{eurPrice}€</span>
                      </div>
                    )}
                    {displayCard.prices?.eur_foil &&
                      formatPrice(displayCard.prices.eur_foil) && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Foil:</span>
                          <span className="font-semibold">
                            {formatPrice(displayCard.prices.eur_foil)}€
                          </span>
                        </div>
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
              </CardContent>
            </Card>
          )}

          {/* Bloc Légalités */}
          {card.legalities && (
            <Card>
              <CardHeader>
                <CardTitle>Légalités</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(card.legalities).map(([format, status]) => {
                    if (status === "not_legal") return null;

                    const statusColors: { [key: string]: string } = {
                      legal: "bg-green-700/20 text-green-300 border-green-700",
                      banned: "bg-red-700/20 text-red-300 border-red-700",
                      restricted:
                        "bg-orange-700/20 text-orange-300 border-orange-700",
                    };

                    const statusLabels: { [key: string]: string } = {
                      legal: "Légal",
                      banned: "Banni",
                      restricted: "Restreint",
                    };

                    return (
                      <div
                        key={format}
                        className={cn(
                          "px-3 py-2 rounded-md border",
                          statusColors[status] ||
                            "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        <p className="font-semibold text-xs uppercase">
                          {format.replace("_", " ")}
                        </p>
                        <p className="text-sm">
                          {statusLabels[status] || status}
                        </p>
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
              <div className="grid grid-cols-2 gap-4">
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
        </div>
      </div>
    </ResponsiveDialog>
  );
}
