import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Layers, Plus } from "lucide-react";

export function NoDecks({ onCreateDeck }: { onCreateDeck: () => void }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Layers />
        </EmptyMedia>
        <EmptyTitle>Aucun deck</EmptyTitle>
        <EmptyDescription>
          Vous n&apos;avez pas encore créé de decks. Commencez par créer votre
          premier deck en cliquant sur le bouton &ldquo;Nouveau deck&rdquo;.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button size="sm" onClick={onCreateDeck}>
            <Plus />
            Nouveau deck
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
