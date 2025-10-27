"use client";

import { Button } from "@/components/ui/button";
import { MTGCard } from "@/lib/scryfall-api";
import { Layers, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Deck {
  id: string;
  name: string;
  format: string;
  cardCount: number;
}

interface DeckSelectorProps {
  card: MTGCard;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeckSelector({
  card,
  isOpen,
  onClose,
  onSuccess,
}: DeckSelectorProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingToDeck, setAddingToDeck] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDecks();
    }
  }, [isOpen]);

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/decks");
      if (response.ok) {
        const data = await response.json();
        setDecks(data);
      }
    } catch (error) {
      console.error("Error fetching decks:", error);
      toast.error("Erreur lors du chargement des decks");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToDeck = async (deckId: string) => {
    setAddingToDeck(true);
    try {
      const response = await fetch(`/api/decks/${deckId}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardData: card,
          isSideboard: false,
        }),
      });

      if (response.ok) {
        toast.success(`${card.name} ajouté au deck`);
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de l'ajout au deck");
      }
    } catch (error) {
      console.error("Error adding card to deck:", error);
      toast.error("Erreur lors de l'ajout au deck");
    } finally {
      setAddingToDeck(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            Ajouter {card.name} à un deck
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Chargement des decks...</p>
            </div>
          ) : decks.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {decks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => handleAddToDeck(deck.id)}
                  disabled={addingToDeck}
                  className="w-full px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-3"
                >
                  <Layers className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{deck.name}</div>
                    <div className="text-sm text-gray-500">
                      {deck.format} • {deck.cardCount} cartes
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Layers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Aucun deck disponible</p>
              <Button onClick={() => (window.location.href = "/decks")}>
                Créer un deck
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </>
  );
}
