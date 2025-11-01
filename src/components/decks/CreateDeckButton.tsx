"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DeckModal } from "./DeckModal";

export function CreateDeckButton() {
  const router = useRouter();
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCreateDeck = () => {
    setShowDeckModal(true);
  };

  const handleSubmitDeck = async (data: {
    name: string;
    description: string;
    format: string;
  }) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          format: data.format,
          isPublic: false,
        }),
      });

      if (response.ok) {
        toast.success("Deck créé avec succès");
        setShowDeckModal(false);
        router.refresh(); // Rafraîchir les données server-side
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error creating deck:", error);
      toast.error("Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setShowDeckModal(false);
    }
  };

  return (
    <>
      <Button size="iconSm" onClick={handleCreateDeck}>
        <Plus />
        <span data-slot="text">Nouveau deck</span>
      </Button>

      <DeckModal
        isOpen={showDeckModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitDeck}
        deck={null}
        isSubmitting={submitting}
      />
    </>
  );
}
