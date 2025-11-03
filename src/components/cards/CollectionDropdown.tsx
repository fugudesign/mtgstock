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

interface Collection {
  id: string;
  name: string;
  _count: {
    cards: number;
  };
}

interface CollectionDropdownProps {
  card: MTGCard;
  onSuccess?: () => void;
  children: React.ReactNode;
}

export function CollectionDropdown({
  card,
  onSuccess,
  children,
}: CollectionDropdownProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCollections();
    }
  }, [open]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/collections");
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast.error("Erreur lors du chargement des collections");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    setAdding(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardData: card,
        }),
      });

      if (response.ok) {
        toast.success(`${card.name} ajouté à la collection`);
        setOpen(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de l'ajout à la collection");
      }
    } catch (error) {
      console.error("Error adding card to collection:", error);
      toast.error("Erreur lors de l'ajout à la collection");
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
        <DropdownMenuLabel>Ajouter à une collection</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : collections.length > 0 ? (
          collections.map((collection) => (
            <DropdownMenuItem
              key={collection.id}
              onClick={() => handleAddToCollection(collection.id)}
              disabled={adding}
            >
              <div className="flex flex-col">
                <span className="font-medium">{collection.name}</span>
                <span className="text-xs text-muted-foreground">
                  {collection._count.cards} cartes
                </span>
              </div>
              {adding && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>Aucune collection</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
