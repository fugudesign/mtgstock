import {
  CollectionsClient,
  CreateCollectionButton,
} from "@/components/collections";
import { PageHeader } from "@/components/PageHeader";
import { Container } from "@/components/ui/container";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CollectionsPage() {
  // Authentification côté serveur
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  // Chargement des collections côté serveur
  const collectionsData = await prisma.collection.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      _count: {
        select: {
          cards: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transformer les données pour le composant client
  const collections = collectionsData.map((collection) => ({
    ...collection,
    createdAt: collection.createdAt.toISOString(),
  }));

  return (
    <Container>
      {collections.length > 0 && (
        <PageHeader
          title="Mes Collections"
          subtitle="Organisez vos cartes en collections personnalisées"
        >
          <CreateCollectionButton />
        </PageHeader>
      )}

      <CollectionsClient initialCollections={collections} />
    </Container>
  );
}
