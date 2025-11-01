import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Package, X } from "lucide-react";

export default function CollectionDetailLoading() {
  return (
    <div className="min-h-screen px-4">
      {/* Page Header Skeleton */}
      <div className="mb-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <div className="flex items-center gap-4 mt-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <div className="flex items-center gap-2">
                <Package className="size-4 text-muted-foreground" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="iconSm" disabled>
              <Edit />
              <span data-slot="text">Modifier</span>
            </Button>
            <Button variant="outline" size="iconSm" disabled>
              <X />
              <span data-slot="text">Retour</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden"
          >
            <Skeleton className="w-full aspect-5/7" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
