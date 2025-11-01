"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Schéma de validation avec zod
const formSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du deck est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional(),
  format: z.enum(
    [
      "standard",
      "modern",
      "commander",
      "legacy",
      "vintage",
      "pauper",
      "pioneer",
      "other",
    ],
    {
      message: "Le format est requis",
    }
  ),
});

type FormData = z.infer<typeof formSchema>;

interface Deck {
  id: string;
  name: string;
  description?: string | null;
  format: string;
  isPublic: boolean;
}

interface DeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    format: string;
  }) => Promise<void>;
  deck?: Deck | null;
  isSubmitting?: boolean;
}

/**
 * Modal réutilisable pour créer ou éditer un deck
 * Utilise le Dialog shadcn/ui avec react-hook-form pour une meilleure UX
 */
export function DeckModal({
  isOpen,
  onClose,
  onSubmit,
  deck,
  isSubmitting = false,
}: DeckModalProps) {
  // Déterminer si on est en mode édition
  const isEditing = !!deck;
  const title = isEditing ? "Modifier le deck" : "Créer un nouveau deck";
  const submitLabel = isEditing ? "Modifier" : "Créer";

  // Configuration du formulaire avec react-hook-form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      format: "standard",
    },
  });

  // Réinitialiser le formulaire quand la modal s'ouvre/ferme ou change de deck
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: deck?.name || "",
        description: deck?.description || "",
        format: (deck?.format as FormData["format"]) || "standard",
      });
    }
  }, [isOpen, deck, form]);

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({
      name: data.name,
      description: data.description || "",
      format: data.format,
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={isSubmitting}
      >
        Annuler
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting || !form.formState.isValid}
        form="deck-form"
      >
        {isSubmitting ? "Traitement..." : submitLabel}
      </Button>
    </>
  );

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      description={
        isEditing
          ? "Modifiez les informations de votre deck."
          : "Créez un nouveau deck pour organiser vos cartes."
      }
      footer={footer}
      className="sm:max-w-md"
    >
      <Form {...form}>
        <form
          id="deck-form"
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du deck</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ex: Mon Deck Esper Control"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Format</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="commander">Commander</SelectItem>
                    <SelectItem value="legacy">Legacy</SelectItem>
                    <SelectItem value="vintage">Vintage</SelectItem>
                    <SelectItem value="pauper">Pauper</SelectItem>
                    <SelectItem value="pioneer">Pioneer</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optionnelle)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Description de votre deck..."
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </ResponsiveDialog>
  );
}
