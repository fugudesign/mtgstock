import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/decks/[id] - Récupérer un deck spécifique avec ses cartes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (deck.userId !== user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    return NextResponse.json(deck);
  } catch (error) {
    console.error("Error fetching deck:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/decks/[id] - Supprimer un deck
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const deck = await prisma.deck.findUnique({
      where: { id },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck non trouvé" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (deck.userId !== user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Supprimer d'abord les cartes du deck
    await prisma.deckCard.deleteMany({
      where: { deckId: id },
    });

    // Puis supprimer le deck
    await prisma.deck.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deck supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting deck:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/decks/[id] - Mettre à jour un deck
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const deck = await prisma.deck.findUnique({
      where: { id },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck non trouvé" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (deck.userId !== user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, format } = body;

    const updatedDeck = await prisma.deck.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(format && { format }),
      },
    });

    return NextResponse.json(updatedDeck);
  } catch (error) {
    console.error("Error updating deck:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
