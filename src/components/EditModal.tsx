"use client";

import { Modal } from "@/components/Modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: "collection" | "deck";
  item: {
    id: string;
    name: string;
    description: string | null;
    format?: string; // Seulement pour les decks
  };
}

export function EditModal({
  isOpen,
  onClose,
  onSuccess,
  type,
  item,
}: EditModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiser les valeurs quand la modal s'ouvre
  useEffect(() => {
    if (isOpen && item) {
      setName(item.name);
      setDescription(item.description || "");
      if (type === "deck" && item.format) {
        setFormat(item.format);
      }
    }
  }, [isOpen, item, type]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl =
        type === "collection"
          ? `/api/collections/${item.id}`
          : `/api/decks/${item.id}`;

      const body = {
        name: name.trim(),
        description: description.trim() || null,
        ...(type === "deck" && { format: format.trim() || "casual" }),
      };

      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(
          `${type === "collection" ? "Collection" : "Deck"} modifié avec succès`
        );
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Erreur lors de la modification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatOptions = [
    { value: "casual", label: "Casual" },
    { value: "standard", label: "Standard" },
    { value: "modern", label: "Modern" },
    { value: "legacy", label: "Legacy" },
    { value: "vintage", label: "Vintage" },
    { value: "commander", label: "Commander" },
    { value: "pioneer", label: "Pioneer" },
    { value: "pauper", label: "Pauper" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modifier ${type === "collection" ? "la collection" : "le deck"}`}
      onSubmit={handleSubmit}
      submitLabel="Modifier"
      isSubmitting={isSubmitting}
      variant="edit"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">
            Nom {type === "collection" ? "de la collection" : "du deck"}
          </Label>
          <Input
            id="name"
            placeholder={`Mon ${type === "collection" ? "collection" : "deck"}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description (optionnelle)</Label>
          <Textarea
            id="description"
            placeholder="Description de votre collection..."
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        {type === "deck" && (
          <div>
            <Label htmlFor="format">Format</Label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              {formatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </Modal>
  );
}
