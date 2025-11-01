import { CreateDeckButton, DecksClient } from "@/components/decks";
import { PageHeader } from "@/components/PageHeader";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DecksPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // Récupérer les decks de l'utilisateur avec le nombre de cartes
  const decks = await prisma.deck.findMany({
    where: { userId: session.user.id },
    include: {
      cards: {
        select: {
          quantity: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculer le nombre total de cartes pour chaque deck
  const decksWithCardCount = decks.map((deck) => ({
    id: deck.id,
    name: deck.name,
    description: deck.description,
    format: deck.format,
    isPublic: deck.isPublic,
    cardCount: deck.cards.reduce((sum, card) => sum + card.quantity, 0),
    createdAt: deck.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4 px-4">
      {decksWithCardCount.length > 0 && (
        <PageHeader
          title="Mes Decks"
          subtitle="Construisez vos decks compétitifs (60-100 cartes, max 4 copies par carte)"
        >
          <CreateDeckButton />
        </PageHeader>
      )}

      <DecksClient initialDecks={decksWithCardCount} />
    </div>
  );
}
