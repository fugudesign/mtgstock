import { CollectionDetailClient } from "@/components/collections/CollectionDetailClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

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

  // Transformer les données pour le client
  const serializedCollection = {
    ...collection,
    createdAt: collection.createdAt.toISOString(),
    cards: collection.cards.map((collectionCard) => ({
      ...collectionCard,
      acquiredDate: collectionCard.acquiredDate.toISOString(),
    })),
  };

  return <CollectionDetailClient collection={serializedCollection} />;
}
