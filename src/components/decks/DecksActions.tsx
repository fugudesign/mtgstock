"use client";

import { ItemCard } from "@/components/ItemCard";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DeckModal } from "./DeckModal";
import { DeleteDeckAlert } from "./DeleteDeckAlert";
import { NoDecks } from "./NoDecks";

interface Deck {
  id: string;
  name: string;
  description: string | null;
  format: string;
  isPublic: boolean;
  cardCount: number;
  createdAt: string;
}

interface DecksClientProps {
  initialDecks: Deck[];
}

export function DecksActions({ initialDecks }: DecksClientProps) {
  const router = useRouter();
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deletingDeck, setDeletingDeck] = useState<Deck | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Ouvrir la modal pour créer un deck
  const handleCreateDeck = () => {
    setEditingDeck(null);
    setShowDeckModal(true);
  };

  // Ouvrir la modal pour éditer un deck
  const handleEditDeck = (id: string) => {
    const deck = initialDecks.find((d) => d.id === id);
    if (deck) {
      setEditingDeck(deck);
      setShowDeckModal(true);
    }
  };

  // Ouvrir l'alert pour supprimer un deck
  const handleDeleteDeck = (id: string) => {
    const deck = initialDecks.find((d) => d.id === id);
    if (deck) {
      setDeletingDeck(deck);
      setShowDeleteAlert(true);
    }
  };

  // Soumettre le formulaire de création/édition
  const handleSubmitDeck = async (data: {
    name: string;
    description: string;
    format: string;
  }) => {
    setSubmitting(true);
    try {
      const isEditing = !!editingDeck;
      const url = isEditing ? `/api/decks/${editingDeck.id}` : "/api/decks";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
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
        if (isEditing) {
          toast.success("Deck modifié avec succès");
        } else {
          toast.success("Deck créé avec succès");
        }

        setShowDeckModal(false);
        setEditingDeck(null);
        router.refresh(); // Rafraîchir les données server-side
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Error saving deck:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmer la suppression d'un deck
  const handleConfirmDelete = async () => {
    if (!deletingDeck) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/decks/${deletingDeck.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setShowDeleteAlert(false);
        setDeletingDeck(null);
        toast.success("Deck supprimé avec succès");
        router.refresh(); // Rafraîchir les données server-side
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting deck:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setSubmitting(false);
    }
  };

  // Fermer les modales
  const handleCloseModal = () => {
    if (!submitting) {
      setShowDeckModal(false);
      setEditingDeck(null);
    }
  };

  const handleCloseDeleteAlert = () => {
    if (!submitting) {
      setShowDeleteAlert(false);
      setDeletingDeck(null);
    }
  };

  const getDeckStatus = (cardCount: number) => {
    if (cardCount < 60) {
      return {
        label: `${cardCount}/60 - Incomplet`,
        color: "bg-orange-500/20 text-orange-400 border-orange-500",
        icon: AlertCircle,
      };
    } else if (cardCount >= 60 && cardCount <= 100) {
      return {
        label: `${cardCount} cartes - Valide`,
        color: "bg-green-500/20 text-green-400 border-green-500",
        icon: CheckCircle2,
      };
    } else {
      return {
        label: `${cardCount}/100 - Trop de cartes`,
        color: "bg-orange-500/20 text-orange-400 border-orange-500",
        icon: AlertCircle,
      };
    }
  };

  return (
    <>
      {initialDecks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialDecks.map((deck) => {
            const status = getDeckStatus(deck.cardCount);
            const StatusIcon = status.icon;

            return (
              <ItemCard
                key={deck.id}
                title={deck.name}
                description={deck.description}
                icon={Layers}
                iconColor="text-purple-600"
                href={`/decks/${deck.id}`}
                badges={
                  <>
                    <Badge variant="outline" className="capitalize">
                      {deck.format}
                    </Badge>
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${status.color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      <span>{status.label}</span>
                    </div>
                  </>
                }
                metadata={
                  <span className="text-sm text-muted-foreground font-medium">
                    {deck.cardCount} carte{deck.cardCount !== 1 ? "s" : ""}
                  </span>
                }
                onEdit={() => handleEditDeck(deck.id)}
                onDelete={() => handleDeleteDeck(deck.id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="pt-24">
          <NoDecks onCreateDeck={handleCreateDeck} />
        </div>
      )}

      {/* Deck Modal (Create/Edit) */}
      <DeckModal
        key={editingDeck?.id || "new"}
        isOpen={showDeckModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitDeck}
        deck={editingDeck}
        isSubmitting={submitting}
      />

      {/* Delete Deck Alert */}
      <DeleteDeckAlert
        isOpen={showDeleteAlert}
        onClose={handleCloseDeleteAlert}
        onConfirm={handleConfirmDelete}
        deck={deletingDeck}
        isDeleting={submitting}
      />
    </>
  );
}
