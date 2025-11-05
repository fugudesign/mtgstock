import { cn } from "@/lib/utils";

interface SearchResultsCountProps {
  count: number;
  className?: string;
}

export function SearchResultsCount({
  count,
  className,
}: SearchResultsCountProps) {
  const plurialify = (word: string, count: number) => {
    return count > 1 ? `${word}s` : word;
  };

  return (
    count > 0 && (
      <div className={cn("text-xs text-muted-foreground", className)}>
        {count} {plurialify("carte", count)} {plurialify("trouvée", count)}
      </div>
    )
  );
}
