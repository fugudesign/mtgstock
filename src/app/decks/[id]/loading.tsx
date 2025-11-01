import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-5 w-96" />
              <div className="flex items-center gap-4 pt-2">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-7 w-32" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>

        {/* Cards Title */}
        <Skeleton className="h-8 w-48 mb-4" />

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[5/7] w-full" />
              <CardContent className="p-3">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
