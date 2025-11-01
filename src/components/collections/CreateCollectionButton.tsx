"use client";

import { CollectionModal } from "@/components/collections";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function CreateCollectionButton() {
  const router = useRouter();
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCreateCollection = () => {
    setShowCollectionModal(true);
  };

  const handleSubmitCollection = async (data: {
    name: string;
    description: string;
  }) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
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
        toast.success("Collection créée avec succès");
        setShowCollectionModal(false);
        router.refresh(); // Rafraîchir les données server-side
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setShowCollectionModal(false);
    }
  };

  return (
    <>
      <Button size="iconSm" onClick={handleCreateCollection}>
        <Plus />
        <span data-slot="text">Nouvelle collection</span>
      </Button>

      <CollectionModal
        isOpen={showCollectionModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitCollection}
        collection={null}
        isSubmitting={submitting}
      />
    </>
  );
}
