"use client";

import {
  CollectionModal,
  DeleteCollectionAlert,
  NoCollections,
} from "@/components/collections";
import { ItemCard } from "@/components/shared/ItemCard";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Collection {
  id: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: string;
  _count: {
    cards: number;
  };
}

interface CollectionsClientProps {
  initialCollections: Collection[];
}

export function CollectionsClient({
  initialCollections,
}: CollectionsClientProps) {
  const router = useRouter();
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null
  );
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deletingCollection, setDeletingCollection] =
    useState<Collection | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Ouvrir la modal pour créer une collection
  const handleCreateCollection = () => {
    setEditingCollection(null);
    setShowCollectionModal(true);
  };

  // Ouvrir la modal pour éditer une collection
  const handleEditCollection = (id: string) => {
    const collection = initialCollections.find((c) => c.id === id);
    if (collection) {
      setEditingCollection(collection);
      setShowCollectionModal(true);
    }
  };

  // Ouvrir l'alert pour supprimer une collection
  const handleDeleteCollection = (id: string) => {
    const collection = initialCollections.find((c) => c.id === id);
    if (collection) {
      setDeletingCollection(collection);
      setShowDeleteAlert(true);
    }
  };

  // Soumettre le formulaire de création/édition
  const handleSubmitCollection = async (data: {
    name: string;
    description: string;
  }) => {
    setSubmitting(true);
    try {
      const isEditing = !!editingCollection;
      const url = isEditing
        ? `/api/collections/${editingCollection.id}`
        : "/api/collections";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          isPublic: false,
        }),
      });

      if (response.ok) {
        if (isEditing) {
          toast.success("Collection modifiée avec succès");
        } else {
          toast.success("Collection créée avec succès");
        }

        setShowCollectionModal(false);
        setEditingCollection(null);
        router.refresh(); // Rafraîchir les données server-side
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Error saving collection:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmer la suppression d'une collection
  const handleConfirmDelete = async () => {
    if (!deletingCollection) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/collections/${deletingCollection.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setShowDeleteAlert(false);
        setDeletingCollection(null);
        toast.success("Collection supprimée avec succès");
        router.refresh(); // Rafraîchir les données server-side
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setSubmitting(false);
    }
  };

  // Fermer les modales
  const handleCloseModal = () => {
    if (!submitting) {
      setShowCollectionModal(false);
      setEditingCollection(null);
    }
  };

  const handleCloseDeleteAlert = () => {
    if (!submitting) {
      setShowDeleteAlert(false);
      setDeletingCollection(null);
    }
  };

  return (
    <>
      {initialCollections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialCollections.map((collection) => (
            <ItemCard
              key={collection.id}
              title={collection.name}
              description={collection.description}
              icon={BookOpen}
              iconColor="text-blue-600"
              href={`/collections/${collection.id}`}
              badges={
                <Badge variant={collection.isPublic ? "default" : "secondary"}>
                  {collection.isPublic ? "Public" : "Privé"}
                </Badge>
              }
              metadata={
                <span className="text-sm text-muted-foreground font-medium">
                  {collection._count.cards} carte
                  {collection._count.cards !== 1 ? "s" : ""}
                </span>
              }
              onEdit={() => handleEditCollection(collection.id)}
              onDelete={() => handleDeleteCollection(collection.id)}
            />
          ))}
        </div>
      ) : (
        <div className="pt-24">
          <NoCollections onCreateCollection={handleCreateCollection} />
        </div>
      )}

      {/* Collection Modal (Create/Edit) */}
      <CollectionModal
        key={editingCollection?.id || "new"}
        isOpen={showCollectionModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitCollection}
        collection={editingCollection}
        isSubmitting={submitting}
      />

      {/* Delete Collection Alert */}
      <DeleteCollectionAlert
        isOpen={showDeleteAlert}
        onClose={handleCloseDeleteAlert}
        onConfirm={handleConfirmDelete}
        collection={deletingCollection}
        isDeleting={submitting}
      />
    </>
  );
}
