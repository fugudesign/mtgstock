"use client";

import { CardDetailContent } from "@/components/cards/CardDetailContent";
import { CollectionDropdown } from "@/components/cards/CollectionDropdown";
import { DeckDropdown } from "@/components/cards/DeckDropdown";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useMediaQuery } from "@/hooks";
import { priceCache } from "@/lib/price-cache";
import { MTGCard, mtgApiService } from "@/lib/scryfall-api";
import { cn } from "@/lib/utils";
import { BookOpen, Layers } from "lucide-react";
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

  // Footer avec les boutons d'action
  const footerActions = (
    <div
      className={cn(
        "w-full",
        isDesktop ? "grid grid-cols-3 gap-6" : "space-y-2 pt-2 pb-4"
      )}
    >
      <CollectionDropdown card={card}>
        <Button
          size={isDesktop ? "default" : "sm"}
          variant="default"
          className="w-full"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Ajouter à une collection
        </Button>
      </CollectionDropdown>

      <DeckDropdown card={card}>
        <Button
          size={isDesktop ? "default" : "sm"}
          variant="default"
          className="w-full"
        >
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
      footer={footerActions}
      // Desktop: Dialog très large et haut (force avec !important), Mobile: Drawer quasi fullscreen
      desktopClassName="!max-w-7xl !w-[95vw] !h-[90vh] overflow-hidden flex flex-col"
      mobileClassName="!h-[95vh] !max-h-[95vh] overflow-hidden"
    >
      <CardDetailContent
        card={card}
        enrichedPrices={enrichedPrices}
        loadingPrices={loadingPrices}
      />
    </ResponsiveDialog>
  );
}
