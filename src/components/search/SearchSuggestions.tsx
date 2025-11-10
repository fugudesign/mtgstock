"use client";

import { Button } from "@/components/ui/button";
import { EmptyContent } from "@/components/ui/empty";
import { Sparkles } from "lucide-react";

interface SearchSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
}

const SUGGESTIONS = [
  "Lightning Bolt",
  "Black Lotus",
  "Sol Ring",
  "Counterspell",
  "Birds of Paradise",
  "Thoughtseize",
  "Path to Exile",
  "Snapcaster Mage",
];

export function SearchSuggestions({
  onSuggestionClick,
}: SearchSuggestionsProps) {
  return (
    <EmptyContent>
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span>Suggestions de recherche</span>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {SUGGESTIONS.map((suggestion) => (
          <Button
            key={suggestion}
            variant="outline"
            size="sm"
            onClick={() => onSuggestionClick(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </EmptyContent>
  );
}
