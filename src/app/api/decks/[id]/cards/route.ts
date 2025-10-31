import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Règles de validation des decks
const DECK_RULES = {
  MIN_CARDS: 60,
  MAX_CARDS: 100,
  MAX_COPIES: 4,
  BASIC_LANDS: ["Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes"], // Pas de limite pour les terrains de base
};

// POST /api/decks/[id]/cards - Ajouter une carte au deck
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const deck = await prisma.deck.findUnique({
      where: { id },
      include: {
        cards: {
          include: {
            card: true,
          },
        },
      },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck non trouvé" }, { status: 404 });
    }

    if (deck.userId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { cardData, quantity = 1 } = body;

    console.log("POST /api/decks/[id]/cards - cardData received:", {
      hasCardData: !!cardData,
      cardDataId: cardData?.id,
      cardDataKeys: cardData ? Object.keys(cardData) : [],
    });

    if (!cardData || !cardData.id) {
      return NextResponse.json(
        { error: "Données de carte invalides" },
        { status: 400 }
      );
    }

    // Calculer le nombre total de cartes dans le deck
    const currentTotalCards = deck.cards
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .reduce((sum: number, card: any) => sum + card.quantity, 0);

    // Vérifier la limite maximale de cartes
    if (currentTotalCards + quantity > DECK_RULES.MAX_CARDS) {
      return NextResponse.json(
        {
          error: `Un deck ne peut pas contenir plus de ${DECK_RULES.MAX_CARDS} cartes`,
        },
        { status: 400 }
      );
    }

    // Vérifier si c'est un terrain de base (pas de limite de copies)
    const isBasicLand = DECK_RULES.BASIC_LANDS.some(
      (land) =>
        cardData.name.includes(land) &&
        cardData.type_line?.includes("Basic Land")
    );

    // Vérifier la carte existe déjà dans le deck
    const existingDeckCard = deck.cards.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => c.card.id === cardData.id
    );

    if (existingDeckCard) {
      // Vérifier la limite de 4 copies (sauf terrains de base)
      if (
        !isBasicLand &&
        existingDeckCard.quantity + quantity > DECK_RULES.MAX_COPIES
      ) {
        return NextResponse.json(
          {
            error: `Maximum ${DECK_RULES.MAX_COPIES} copies de la même carte (sauf terrains de base)`,
          },
          { status: 400 }
        );
      }

      // Incrémenter la quantité
      const updated = await prisma.deckCard.update({
        where: { id: existingDeckCard.id },
        data: { quantity: existingDeckCard.quantity + quantity },
      });

      return NextResponse.json({
        message: "Quantité mise à jour",
        deckCard: updated,
      });
    }

    // Vérifier la limite de 4 copies pour une nouvelle carte
    if (!isBasicLand && quantity > DECK_RULES.MAX_COPIES) {
      return NextResponse.json(
        {
          error: `Maximum ${DECK_RULES.MAX_COPIES} copies de la même carte`,
        },
        { status: 400 }
      );
    }

    // Vérifier si la carte existe déjà dans la base de données
    let card = await prisma.card.findUnique({
      where: { id: cardData.id },
    });

    // Si la carte n'existe pas, la créer
    if (!card) {
      // Déterminer l'URL de l'image (cartes simples vs double-face)
      let imageUrl = null;
      if (cardData.image_uris?.normal) {
        imageUrl = cardData.image_uris.normal;
      } else if (
        cardData.card_faces &&
        cardData.card_faces.length > 0 &&
        cardData.card_faces[0].image_uris?.normal
      ) {
        imageUrl = cardData.card_faces[0].image_uris.normal;
      }

      card = await prisma.card.create({
        data: {
          id: cardData.id, // Utiliser l'ID Scryfall directement
          name: cardData.name,
          imageUrl,
          manaCost: cardData.mana_cost || null,
          type: cardData.type_line || null,
          rarity: cardData.rarity || null,
          setName: cardData.set_name || null,
        },
      });
    }

    // Ajouter la carte au deck
    const deckCard = await prisma.deckCard.create({
      data: {
        deckId: id,
        cardId: card.id,
        quantity,
      },
      include: {
        card: true,
      },
    });

    return NextResponse.json(
      {
        message: "Carte ajoutée au deck",
        deckCard,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding card to deck:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/decks/[id]/cards?cardId=xxx - Retirer une carte du deck
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get("cardId");

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!cardId) {
      return NextResponse.json(
        { error: "ID de carte manquant" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const deck = await prisma.deck.findUnique({
      where: { id },
    });

    if (!deck || deck.userId !== user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Supprimer la carte du deck
    await prisma.deckCard.deleteMany({
      where: {
        deckId: id,
        cardId: cardId,
      },
    });

    return NextResponse.json({ message: "Carte retirée du deck" });
  } catch (error) {
    console.error("Error removing card from deck:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
