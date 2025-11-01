import { DeckDetailClient } from "@/components/decks/DeckDetailClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DeckDetailsPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // Récupérer le deck avec ses cartes
  const deck = await prisma.deck.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      cards: {
        include: {
          card: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              manaCost: true,
              type: true,
            },
          },
        },
        orderBy: {
          card: {
            name: "asc",
          },
        },
      },
    },
  });

  if (!deck) {
    notFound();
  }

  // Sérialiser les dates
  const serializedDeck = {
    ...deck,
    createdAt: deck.createdAt.toISOString(),
  };

  return <DeckDetailClient deck={serializedDeck} />;
}
