"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MTGCard } from "@/lib/scryfall-api";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Deck {
  id: string;
  name: string;
  format: string;
  cardCount: number;
}

interface DeckDropdownProps {
  card: MTGCard;
  onSuccess?: () => void;
  children: React.ReactNode;
}

export function DeckDropdown({
  card,
  onSuccess,
  children,
}: DeckDropdownProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDecks();
    }
  }, [open]);

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
    setAdding(true);
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
        setOpen(false);
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
      setAdding(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>Ajouter à un deck</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : decks.length > 0 ? (
          decks.map((deck) => (
            <DropdownMenuItem
              key={deck.id}
              onClick={() => handleAddToDeck(deck.id)}
              disabled={adding}
            >
              <div className="flex flex-col">
                <span className="font-medium">{deck.name}</span>
                <span className="text-xs text-muted-foreground">
                  {deck.format} • {deck.cardCount} cartes
                </span>
              </div>
              {adding && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>Aucun deck</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
