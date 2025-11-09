"use client";

import { SearchFilters } from "@/components/search/SearchFilters";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks";
import { SearchFormValues } from "@/lib/search-schema";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";

interface SearchFiltersWrapperProps {
  form: UseFormReturn<SearchFormValues>;
  userLanguage: string;
  showFilters: boolean;
  onClose?: () => void;
  onApply?: () => void;
}

/**
 * Wrapper responsive pour les filtres de recherche
 * - Mobile : Sheet (drawer depuis le bas)
 * - Desktop : Expansion en dessous de la barre de recherche
 */
export function SearchFiltersWrapper({
  form,
  userLanguage,
  showFilters,
  onClose,
  onApply,
}: SearchFiltersWrapperProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [hasBeenReset, setHasBeenReset] = useState(false);

  // Surveiller les valeurs du formulaire pour détecter les changements
  form.watch();

  // Calculer si le bouton doit être actif
  // Actif si : isDirty (valeurs modifiées) OU si reset vient d'être fait
  const isSearchButtonEnabled = form.formState.isDirty || hasBeenReset;

  // Desktop : expansion classique
  if (isDesktop) {
    return showFilters ? (
      <div className="p-4 pt-2 bg-card border border-border rounded-md animate-in fade-in slide-in-from-top-2 duration-200">
        <SearchFilters form={form} userLanguage={userLanguage} />
      </div>
    ) : null;
  }

  const handleApply = () => {
    setHasBeenReset(false); // Reset le flag après application
    onApply?.();
    onClose?.();
  };

  const handleReset = () => {
    // Récupérer la langue actuelle du formulaire pour la préserver
    const currentLanguage = form.getValues("language");

    // Reset avec les valeurs par défaut
    const defaultValues: SearchFormValues = {
      query: "",
      rarity: "",
      colors: "",
      type: "",
      set: "",
      language: currentLanguage || "",
    };

    // Réinitialiser le formulaire
    form.reset(defaultValues);

    // Marquer qu'un reset a été fait pour activer le bouton
    setHasBeenReset(true);
  };

  const handleClose = () => {
    setHasBeenReset(false);
    onClose?.();
  };

  // Mobile : Sheet
  return (
    <Sheet open={showFilters} onOpenChange={handleClose}>
      <SheetContent side="right" className="h-full w-11/12">
        <SheetHeader>
          <SheetTitle>Filtres de recherche</SheetTitle>
          <SheetDescription>
            Affinez votre recherche avec des critères supplémentaires
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 overflow-y-auto max-h-[calc(85vh-8rem)]">
          <SearchFilters form={form} userLanguage={userLanguage} />
        </div>
        <SheetFooter>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleReset}
            className="w-full"
          >
            Réinitialiser
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!isSearchButtonEnabled}
            className="w-full"
          >
            Rechercher
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
