import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mtgApiService } from "@/lib/scryfall-api";
import { NextResponse } from "next/server";

/**
 * GET /api/cards/[id]/price
 * Récupère le prix d'une carte et son évolution pour l'utilisateur connecté
 * Uniquement pour les cartes dans les collections/decks de l'utilisateur
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: cardId } = await context.params;
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    // Vérifier que l'utilisateur possède cette carte (collection ou deck)
    const [collectionCards, deckCards] = await Promise.all([
      prisma.collectionCard.findMany({
        where: {
          cardId,
          collection: { userId: session.user.id },
        },
        include: {
          collection: { select: { id: true, name: true } },
        },
      }),
      prisma.deckCard.findMany({
        where: {
          cardId,
          deck: { userId: session.user.id },
        },
        include: {
          deck: { select: { id: true, name: true } },
        },
      }),
    ]);

    const ownsCard = collectionCards.length > 0 || deckCards.length > 0;

    if (!ownsCard) {
      return NextResponse.json(
        { error: "Carte non trouvée dans vos collections/decks" },
        { status: 404 }
      );
    }

    // Récupérer les informations de la carte depuis Scryfall
    const card = await mtgApiService.getCardById(cardId);

    if (!card) {
      return NextResponse.json(
        { error: "Card not found on Scryfall", noPriceAvailable: true },
        { status: 404 }
      );
    }

    let currentPrice: number | null = null;
    let currency: string = "EUR";

    // Si la carte n'a pas de prix (version non-anglaise), récupérer la version anglaise via oracle_id
    if (!card.prices?.eur && !card.prices?.usd && card.oracle_id) {
      try {
        // Chercher la version anglaise via oracle_id
        const response = await fetch(
          `https://api.scryfall.com/cards/search?q=oracleid:${card.oracle_id}+lang:en&unique=prints`
        );

        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data.length > 0) {
            const englishVersion = result.data[0];
            // Utiliser les prix de la version anglaise
            if (englishVersion.prices?.eur) {
              currentPrice = parseFloat(englishVersion.prices.eur);
              currency = "EUR";
            } else if (englishVersion.prices?.usd) {
              currentPrice = parseFloat(englishVersion.prices.usd);
              currency = "USD";
            }
          }
        }
      } catch (error) {
        console.error("Error fetching English version:", error);
      }
    } else {
      // La carte a déjà des prix, les utiliser directement
      if (card.prices?.eur) {
        currentPrice = parseFloat(card.prices.eur);
        currency = "EUR";
      } else if (card.prices?.usd) {
        currentPrice = parseFloat(card.prices.usd);
        currency = "USD";
      }
    }

    // Si pas de prix disponible, on retourne quand même mais sans tracking
    if (currentPrice === 0) {
      return NextResponse.json({
        cardId,
        price: 0,
        priceFoil: null,
        currency,
        priceChange: null,
        priceChangePercent: null,
        lastChecked: new Date(),
        noPriceAvailable: true,
        ownedIn: {
          collections: collectionCards.map((cc) => ({
            id: cc.collection.id,
            name: cc.collection.name,
            quantity: cc.quantity,
            foil: cc.foil,
          })),
          decks: deckCards.map((dc) => ({
            id: dc.deck.id,
            name: dc.deck.name,
            quantity: dc.quantity,
          })),
        },
      });
    }

    // Récupérer le dernier prix enregistré (> 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastPriceRecord = await prisma.cardPriceHistory.findFirst({
      where: {
        userId: session.user.id,
        cardId,
        checkedAt: { lt: oneDayAgo },
      },
      orderBy: { checkedAt: "desc" },
    });

    // Calculer la variation
    let priceChange: "up" | "down" | "stable" | null = null;
    let priceChangePercent: number | null = null;

    if (currentPrice !== null && lastPriceRecord && lastPriceRecord.price > 0) {
      const diff = currentPrice - lastPriceRecord.price;
      priceChangePercent = (diff / lastPriceRecord.price) * 100;

      if (priceChangePercent > 2) {
        priceChange = "up";
      } else if (priceChangePercent < -2) {
        priceChange = "down";
      } else {
        priceChange = "stable";
      }
    }

    // Mettre à jour le prix si nécessaire (> 24h depuis dernière vérification)
    const mostRecentCheck = await prisma.cardPriceHistory.findFirst({
      where: { userId: session.user.id, cardId },
      orderBy: { checkedAt: "desc" },
    });

    const shouldUpdate =
      !mostRecentCheck ||
      mostRecentCheck.checkedAt < oneDayAgo ||
      (currentPrice !== null && mostRecentCheck.price !== currentPrice);

    if (shouldUpdate && currentPrice !== null && currentPrice > 0) {
      // Créer une nouvelle entrée dans l'historique
      await prisma.cardPriceHistory.create({
        data: {
          userId: session.user.id,
          cardId,
          price: currentPrice,
          priceFoil: null, // TODO: ajouter support foil
          currency: currency,
        },
      });

      // Mettre à jour le dernier prix sur les CollectionCard et DeckCard
      await Promise.all([
        ...collectionCards.map((cc) =>
          prisma.collectionCard.update({
            where: { id: cc.id },
            data: {
              lastPriceCheck: new Date(),
              lastPriceCurrency: currency,
            },
          })
        ),
        ...deckCards.map((dc) =>
          prisma.deckCard.update({
            where: { id: dc.id },
            data: {
              lastPriceCheck: new Date(),
              lastPriceCurrency: currency,
            },
          })
        ),
      ]);
    }

    return NextResponse.json({
      cardId,
      price: currentPrice,
      priceFoil: null, // TODO: ajouter support foil
      currency: currency,
      priceChange,
      priceChangePercent:
        priceChangePercent !== null
          ? Math.round(priceChangePercent * 10) / 10
          : null,
      lastChecked: mostRecentCheck?.checkedAt || new Date(),
      noPriceAvailable: currentPrice === null,
      ownedIn: {
        collections: collectionCards.map((cc) => ({
          id: cc.collection.id,
          name: cc.collection.name,
          quantity: cc.quantity,
          foil: cc.foil,
        })),
        decks: deckCards.map((dc) => ({
          id: dc.deck.id,
          name: dc.deck.name,
          quantity: dc.quantity,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching card price:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du prix" },
      { status: 500 }
    );
  }
}
