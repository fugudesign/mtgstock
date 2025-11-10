"use client";

import { CardGrid } from "@/components/cards/CardGrid";
import { CollectionModal } from "@/components/collections/CollectionModal";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useMediaQuery } from "@/hooks";
import { MTGCard } from "@/lib/scryfall-api";
import { Edit, Package, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface CollectionCard {
  id: string;
  quantity: number;
  foil: boolean;
  condition: string;
  acquiredDate: string;
  card: {
    id: string;
    name: string;
    imageUrl: string | null;
    setName: string | null;
    rarity: string | null;
    manaCost: string | null;
    type: string | null;
  };
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  cards: CollectionCard[];
  _count: {
    cards: number;
  };
}

interface CollectionDetailClientProps {
  collection: Collection;
}

export function CollectionDetailClient({
  collection: initialCollection,
}: CollectionDetailClientProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getTotalCards = () => {
    return initialCollection.cards.reduce(
      (sum, card) => sum + card.quantity,
      0
    );
  };

  // Transformer une CollectionCard en MTGCard
  const transformCollectionCardToMTGCard = (
    collectionCard: CollectionCard
  ): MTGCard => {
    // Si une carte enrichie est disponible, l'utiliser directement
    const enriched = (
      collectionCard.card as unknown as { __enriched?: MTGCard }
    ).__enriched;
    if (enriched) {
      return {
        ...enriched,
        quantity: collectionCard.quantity,
        foil: collectionCard.foil,
        condition: collectionCard.condition,
      } as MTGCard;
    }

    // Sinon, transformer comme avant (fallback)
    return {
      id: collectionCard.card.id,
      name: collectionCard.card.name,
      image_uris: collectionCard.card.imageUrl
        ? {
            small: collectionCard.card.imageUrl,
            normal: collectionCard.card.imageUrl,
            large: collectionCard.card.imageUrl,
            png: collectionCard.card.imageUrl,
            art_crop: collectionCard.card.imageUrl,
            border_crop: collectionCard.card.imageUrl,
          }
        : undefined,
      set_name: collectionCard.card.setName || "",
      rarity: collectionCard.card.rarity || "",
      mana_cost: collectionCard.card.manaCost || "",
      type_line: collectionCard.card.type || "",
      cmc: 0,
      quantity: collectionCard.quantity,
      foil: collectionCard.foil,
      condition: collectionCard.condition,
    } as unknown as MTGCard;
  };

  // Supprimer une carte de la collection
  const handleRemoveCard = async (cardId: string) => {
    try {
      const response = await fetch(
        `/api/collections/${
          initialCollection.id
        }/cards?cardId=${encodeURIComponent(cardId)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        toast.success("Carte retirée de la collection");
        router.refresh(); // Rafraîchir les données server-side
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de la carte");
    }
  };

  // Éditer la collection
  const handleEditCollection = async (data: {
    name: string;
    description: string;
  }) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/collections/${initialCollection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          isPublic: initialCollection.isPublic,
        }),
      });

      if (response.ok) {
        toast.success("Collection modifiée avec succès");
        setShowEditModal(false);
        router.refresh();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("Erreur lors de la modification");
    } finally {
      setSubmitting(false);
    }
  };

  const mtgCards = initialCollection.cards.map(
    transformCollectionCardToMTGCard
  );

  return (
    <Container>
      <PageHeader
        title={initialCollection.name}
        subtitle={initialCollection.description}
        infos={
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Badge
              variant={initialCollection.isPublic ? "default" : "secondary"}
            >
              {initialCollection.isPublic ? "Public" : "Privé"}
            </Badge>
            <div className="flex items-center gap-2">
              <Package className="size-4" />
              <span className="font-medium">{getTotalCards()} cartes</span>
            </div>
          </div>
        }
        className="mb-4"
      >
        <Button
          variant="outline"
          size={isDesktop ? "default" : "iconSm"}
          asChild
        >
          <Link href="/collections">
            <X />
            <span data-slot="text">Retour</span>
          </Link>
        </Button>
        <Button
          size={isDesktop ? "default" : "iconSm"}
          onClick={() => setShowEditModal(true)}
        >
          <Edit />
          <span data-slot="text">Modifier</span>
        </Button>
      </PageHeader>

      {mtgCards.length > 0 ? (
        <CardGrid
          cards={mtgCards}
          context="collection"
          showActions={true}
          onCardRemove={handleRemoveCard}
        />
      ) : (
        <div className="pt-24">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>Collection vide</EmptyTitle>
              <EmptyDescription>
                Ajoutez des cartes à votre collection depuis la page de
                recherche.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/search">
                  <Search className="mr-2 h-4 w-4" />
                  Rechercher des cartes
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      )}

      {/* Edit Collection Modal */}
      <CollectionModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditCollection}
        collection={{
          id: initialCollection.id,
          name: initialCollection.name,
          description: initialCollection.description,
          isPublic: initialCollection.isPublic,
        }}
        isSubmitting={submitting}
      />
    </Container>
  );
}
