import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BookOpen, Plus } from "lucide-react";

export function NoCollections({
  onCreateCollection,
}: {
  onCreateCollection: () => void;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BookOpen />
        </EmptyMedia>
        <EmptyTitle>Aucune collection</EmptyTitle>
        <EmptyDescription>
          Vous n&apos;avez pas encore créé de collections. Commencez par créer
          votre première collection en cliquant sur le bouton &ldquo;Nouvelle
          collection&rdquo;.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button size="sm" onClick={onCreateCollection}>
            <Plus />
            Nouvelle collection
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
