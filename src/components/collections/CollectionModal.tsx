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
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Schéma de validation avec zod
const formSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom de la collection est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Collection {
  id: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
}

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
  collection?: Collection | null;
  isSubmitting?: boolean;
}

/**
 * Modal réutilisable pour créer ou éditer une collection
 * Utilise le Dialog shadcn/ui avec react-hook-form pour une meilleure UX
 */
export function CollectionModal({
  isOpen,
  onClose,
  onSubmit,
  collection,
  isSubmitting = false,
}: CollectionModalProps) {
  // Déterminer si on est en mode édition
  const isEditing = !!collection;
  const title = isEditing
    ? "Modifier la collection"
    : "Créer une nouvelle collection";
  const submitLabel = isEditing ? "Modifier" : "Créer";

  // Configuration du formulaire avec react-hook-form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Réinitialiser le formulaire quand la modal s'ouvre/ferme ou change de collection
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: collection?.name || "",
        description: collection?.description || "",
      });
    }
  }, [isOpen, collection, form]);

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({
      name: data.name,
      description: data.description || "",
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
        form="collection-form"
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
          ? "Modifiez les informations de votre collection."
          : "Créez une nouvelle collection pour organiser vos cartes."
      }
      footer={footer}
      className="sm:max-w-md"
    >
      <Form {...form}>
        <form
          id="collection-form"
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de la collection</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ex: Ma Collection Modern"
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optionnelle)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Description de votre collection..."
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
