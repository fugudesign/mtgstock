import { CollectionDetailClient } from "@/components/collections/CollectionDetailClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MTGCard } from "@/lib/scryfall-api";
import { notFound, redirect } from "next/navigation";

/**
 * Enrichir les cartes d'une collection avec les données complètes de Scryfall
 * en tenant compte de la langue préférée de l'utilisateur
 */
async function enrichCardsWithScryfallData(
  cardIds: string[],
  userLang: string | null
): Promise<Map<string, MTGCard>> {
  const enrichedCards = new Map<string, MTGCard>();

  // Récupérer les cartes en parallèle (par lots de 10 pour éviter de surcharger l'API)
  const batchSize = 10;
  for (let i = 0; i < cardIds.length; i += batchSize) {
    const batch = cardIds.slice(i, i + batchSize);
    const promises = batch.map(async (cardId) => {
      try {
        // Récupérer la carte depuis Scryfall
        const response = await fetch(
          `https://api.scryfall.com/cards/${cardId}`,
          { cache: "no-store" }
        );

        if (!response.ok) return null;

        const fetchedCard: MTGCard = await response.json();

        // Si la carte est déjà dans la bonne langue ou pas de langue utilisateur
        if (!userLang || fetchedCard.lang === userLang || userLang === "en") {
          return { id: cardId, card: fetchedCard };
        }

        // Chercher la version dans la langue de l'utilisateur via l'oracle_id
        try {
          const searchUrl = `https://api.scryfall.com/cards/search?q=oracleid:${fetchedCard.oracle_id}+lang:${userLang}&unique=prints`;
          const localizedResponse = await fetch(searchUrl, {
            cache: "no-store",
          });

          if (localizedResponse.ok) {
            const localizedData = await localizedResponse.json();

            if (localizedData.data && localizedData.data.length > 0) {
              // Chercher une carte du même set si possible
              const sameSetCard = localizedData.data.find(
                (c: MTGCard) => c.set === fetchedCard.set
              );
              return {
                id: cardId,
                card: sameSetCard || localizedData.data[0],
              };
            }
          }
        } catch (error) {
          console.error("Error fetching localized card:", error);
        }

        // Fallback: retourner la carte d'origine
        return { id: cardId, card: fetchedCard };
      } catch (error) {
        console.error(`Error fetching card ${cardId}:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    results.forEach((result) => {
      if (result) {
        enrichedCards.set(result.id, result.card);
      }
    });

    // Petit délai entre les lots pour éviter de rate-limiter l'API
    if (i + batchSize < cardIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return enrichedCards;
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Authentification côté serveur
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  // Résoudre les params (Next.js 15)
  const { id } = await params;

  // Récupérer la langue de l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { language: true },
  });
  const userLang = user?.language || "en";

  // Charger la collection avec ses cartes
  const collection = await prisma.collection.findUnique({
    where: {
      id,
      userId: session.user.id, // Vérifier que l'utilisateur est propriétaire
    },
    include: {
      cards: {
        include: {
          card: true,
        },
        orderBy: {
          acquiredDate: "desc",
        },
      },
      _count: {
        select: {
          cards: true,
        },
      },
    },
  });

  // Si collection non trouvée ou pas propriétaire
  if (!collection) {
    notFound();
  }

  // Récupérer tous les IDs de cartes
  const cardIds = collection.cards.map((c) => c.card.id);

  // Enrichir avec les données Scryfall dans la langue de l'utilisateur
  const enrichedCardsMap = await enrichCardsWithScryfallData(cardIds, userLang);

  // Transformer les données pour le client en utilisant les cartes enrichies
  const serializedCollection = {
    ...collection,
    createdAt: collection.createdAt.toISOString(),
    cards: collection.cards.map((collectionCard) => {
      const enrichedCard = enrichedCardsMap.get(collectionCard.card.id);

      return {
        ...collectionCard,
        acquiredDate: collectionCard.acquiredDate.toISOString(),
        // Si on a une carte enrichie, on l'utilise, sinon on garde les données de base
        card: enrichedCard
          ? {
              id: enrichedCard.id,
              name: enrichedCard.printed_name || enrichedCard.name,
              imageUrl:
                enrichedCard.image_uris?.normal || collectionCard.card.imageUrl,
              setName: enrichedCard.set_name,
              rarity: enrichedCard.rarity,
              manaCost: enrichedCard.mana_cost || null,
              type:
                enrichedCard.printed_type_line ||
                enrichedCard.type_line ||
                null,
              // Stocker la carte complète pour CardDisplay
              __enriched: enrichedCard,
            }
          : collectionCard.card,
      };
    }),
  } as Parameters<typeof CollectionDetailClient>[0]["collection"]; // Utiliser le type exact attendu

  return <CollectionDetailClient collection={serializedCollection} />;
}
