"use client";

import { CardDetailContent } from "@/components/cards/CardDetailContent";
import { CollectionDropdown } from "@/components/cards/CollectionDropdown";
import { DeckDropdown } from "@/components/cards/DeckDropdown";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useMediaQuery } from "@/hooks";
import { priceCache } from "@/lib/price-cache";
import { MTGCard, mtgApiService } from "@/lib/scryfall-api";
import { ArrowLeft, BookOpen, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface CardDetailClientProps {
  card: MTGCard;
}

export function CardDetailClient({ card }: CardDetailClientProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [enrichedPrices, setEnrichedPrices] = useState<
    MTGCard["prices"] | null
  >(null);
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Enrichir avec les prix anglais pour les cartes non-anglaises
  useEffect(() => {
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
  }, [card]);

  return (
    <Container>
      {/* Header avec bouton retour */}
      <div className="md:py-4 flex items-center justify-between">
        <Button
          size={isDesktop ? "default" : "iconSm"}
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft />
          {isDesktop ? "Retour" : null}
        </Button>

        {/* Boutons d'action sur desktop */}
        <div className="hidden md:flex gap-2">
          <CollectionDropdown card={card}>
            <Button variant="default">
              <BookOpen className="mr-2 h-4 w-4" />
              Ajouter à une collection
            </Button>
          </CollectionDropdown>

          <DeckDropdown card={card}>
            <Button variant="default">
              <Layers className="mr-2 h-4 w-4" />
              Ajouter à un deck
            </Button>
          </DeckDropdown>
        </div>
      </div>

      {/* Contenu de la carte - même affichage que QuickView */}
      <CardDetailContent
        card={card}
        enrichedPrices={enrichedPrices}
        loadingPrices={loadingPrices}
      />

      {/* Boutons d'action sur mobile (en bas) */}
      <div className="md:hidden mt-6 space-y-2">
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
      </div>
    </Container>
  );
}
