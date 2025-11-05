import { SearchField } from "@/components/search/SearchField";
import { SearchFiltersWrapper } from "@/components/search/SearchFiltersWrapper";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks";
import { SearchFormValues } from "@/lib/search-schema";
import { cn } from "@/lib/utils";
import { ListFilterIcon, Loader2, Search } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface SearchBarProps {
  form: UseFormReturn<SearchFormValues>;
  loading: boolean;
  isInitialized: boolean;
  userLanguage: string;
  filtersOpen: boolean;
  onSearch: () => void;
  onOpenFilters: () => void;
  onCloseFilters: () => void;
}

export function SearchBar({
  form,
  loading,
  isInitialized,
  userLanguage,
  filtersOpen,
  onSearch,
  onOpenFilters,
  onCloseFilters,
}: SearchBarProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <form onSubmit={onSearch} className="flex flex-col gap-2">
      <div className="flex w-full">
        <SearchField
          form={form}
          onSearch={onSearch}
          loading={loading}
          isInitialized={isInitialized}
          inputClassName="rounded-r-none"
        />
        <Button
          type="button"
          variant={filtersOpen ? "secondary" : "outline"}
          size={isDesktop ? "default" : "icon"}
          className="rounded-none border-l-0"
          onClick={onOpenFilters}
        >
          <ListFilterIcon className="h-5 w-5" />
        </Button>
        <Button
          type="submit"
          disabled={loading}
          size={isDesktop ? "default" : "icon"}
          className={cn("rounded-l-none", {
            "flex-1 md:flex-none": isDesktop,
          })}
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              {isDesktop && "Recherche..."}
            </>
          ) : (
            <>
              <Search className="size-5" />
              {isDesktop && "Rechercher"}
            </>
          )}
        </Button>
      </div>

      {/* Filtres avancés */}
      <SearchFiltersWrapper
        form={form}
        userLanguage={userLanguage}
        showFilters={filtersOpen}
        onClose={onCloseFilters}
      />
    </form>
  );
}
