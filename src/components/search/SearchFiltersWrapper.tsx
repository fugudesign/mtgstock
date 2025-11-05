"use client";

import { SearchFilters } from "@/components/search/SearchFilters";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks";
import { SearchFormValues } from "@/lib/search-schema";
import { UseFormReturn } from "react-hook-form";

interface SearchFiltersWrapperProps {
  form: UseFormReturn<SearchFormValues>;
  userLanguage: string;
  showFilters: boolean;
  onClose: () => void;
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
}: SearchFiltersWrapperProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Desktop : expansion classique
  if (isDesktop) {
    return showFilters ? (
      <div className="p-4 pt-2 bg-card border border-border rounded-md animate-in fade-in slide-in-from-top-2 duration-200">
        <SearchFilters form={form} userLanguage={userLanguage} />
      </div>
    ) : null;
  }

  // Mobile : Sheet
  return (
    <Sheet open={showFilters} onOpenChange={onClose}>
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
      </SheetContent>
    </Sheet>
  );
}
