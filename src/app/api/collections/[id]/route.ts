import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET a specific collection with its cards
export async function GET(
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

    const collection = await prisma.collection.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        cards: {
          include: {
            card: true,
          },
          orderBy: { acquiredDate: "desc" },
        },
        _count: {
          select: { cards: true },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Collection fetch error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la collection" },
      { status: 500 }
    );
  }
}

// DELETE a collection
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

    await prisma.collection.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Collection supprimée" });
  } catch (error) {
    console.error("Collection deletion error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la collection" },
      { status: 500 }
    );
  }
}

// UPDATE a collection
export async function PUT(
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

    const { name, description, isPublic } = await req.json();

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

    const updatedCollection = await prisma.collection.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        _count: {
          select: { cards: true },
        },
      },
    });

    return NextResponse.json(updatedCollection);
  } catch (error) {
    console.error("Collection update error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la collection" },
      { status: 500 }
    );
  }
}
