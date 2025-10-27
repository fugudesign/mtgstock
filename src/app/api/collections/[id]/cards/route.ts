import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ADD a card to a collection
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
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

    // Check if collection belongs to user
    const collection = await prisma.collection.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection non trouvée" },
        { status: 404 }
      );
    }

    const { cardData, quantity, foil, condition, notes } = await req.json();

    if (!cardData || !cardData.id) {
      return NextResponse.json(
        { error: "Données de carte invalides" },
        { status: 400 }
      );
    }

    // Create or update Card in database
    const card = await prisma.card.upsert({
      where: { id: cardData.id },
      update: {
        name: cardData.name,
        manaCost: cardData.mana_cost || null,
        cmc: cardData.cmc || null,
        type: cardData.type_line || null,
        rarity: cardData.rarity || null,
        setCode: cardData.set || null,
        setName: cardData.set_name || null,
        text: cardData.oracle_text || null,
        artist: cardData.artist || null,
        number: cardData.collector_number || null,
        imageUrl:
          cardData.image_uris?.normal ||
          cardData.card_faces?.[0]?.image_uris?.normal ||
          null,
        colors: JSON.stringify(cardData.colors || []),
        legalities: JSON.stringify(cardData.legalities || {}),
      },
      create: {
        id: cardData.id,
        name: cardData.name,
        manaCost: cardData.mana_cost || null,
        cmc: cardData.cmc || null,
        type: cardData.type_line || null,
        rarity: cardData.rarity || null,
        setCode: cardData.set || null,
        setName: cardData.set_name || null,
        text: cardData.oracle_text || null,
        artist: cardData.artist || null,
        number: cardData.collector_number || null,
        imageUrl:
          cardData.image_uris?.normal ||
          cardData.card_faces?.[0]?.image_uris?.normal ||
          null,
        colors: JSON.stringify(cardData.colors || []),
        legalities: JSON.stringify(cardData.legalities || {}),
      },
    });

    // Check if card already in collection
    const existingCard = await prisma.collectionCard.findUnique({
      where: {
        collectionId_cardId: {
          collectionId: id,
          cardId: card.id,
        },
      },
    });

    if (existingCard) {
      // Update quantity
      const updated = await prisma.collectionCard.update({
        where: {
          collectionId_cardId: {
            collectionId: id,
            cardId: card.id,
          },
        },
        data: {
          quantity: existingCard.quantity + (quantity || 1),
          ...(foil !== undefined && { foil }),
          ...(condition && { condition }),
          ...(notes && { notes }),
        },
        include: {
          card: true,
        },
      });

      return NextResponse.json({
        message: "Quantité mise à jour",
        collectionCard: updated,
      });
    }

    // Add new card to collection
    const collectionCard = await prisma.collectionCard.create({
      data: {
        collectionId: id,
        cardId: card.id,
        quantity: quantity || 1,
        foil: foil || false,
        condition: condition || "nm",
        notes: notes || null,
      },
      include: {
        card: true,
      },
    });

    return NextResponse.json(
      {
        message: "Carte ajoutée à la collection",
        collectionCard,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add card to collection error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout de la carte" },
      { status: 500 }
    );
  }
}

// REMOVE a card from collection or update quantity
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
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

    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get("cardId");

    if (!cardId) {
      return NextResponse.json(
        { error: "ID de carte requis" },
        { status: 400 }
      );
    }

    // Check if collection belongs to user
    const collection = await prisma.collection.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection non trouvée" },
        { status: 404 }
      );
    }

    await prisma.collectionCard.delete({
      where: {
        collectionId_cardId: {
          collectionId: id,
          cardId: cardId,
        },
      },
    });

    return NextResponse.json({ message: "Carte retirée de la collection" });
  } catch (error) {
    console.error("Remove card from collection error:", error);
    return NextResponse.json(
      { error: "Erreur lors du retrait de la carte" },
      { status: 500 }
    );
  }
}
