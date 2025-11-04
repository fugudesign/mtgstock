import { SearchField } from "@/components/search/SearchField";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks";
import { SearchFormValues } from "@/lib/search-schema";
import { cn } from "@/lib/utils";
import { Filter, Loader2, Search } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface SearchBarProps {
  form: UseFormReturn<SearchFormValues>;
  handleSearch: () => void;
  handleOpenFilters: () => void;
  loading: boolean;
  isInitialized: boolean;
}

export function SearchBar({
  form,
  handleSearch,
  handleOpenFilters,
  loading,
  isInitialized,
}: SearchBarProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="flex w-full">
        <SearchField
          form={form}
          onSearch={handleSearch}
          loading={loading}
          isInitialized={isInitialized}
          inputClassName="rounded-r-none"
        />
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
      <Button
        type="button"
        variant="outline"
        size={isDesktop ? "default" : "icon"}
        onClick={handleOpenFilters}
      >
        <Filter className="h-5 w-5" />
      </Button>
    </form>
  );
}
