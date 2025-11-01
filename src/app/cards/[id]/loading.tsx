import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function CardDetailLoading() {
  return (
    <Container>
      {/* Header */}
      <div className="mb-6">
        <Button variant="outline" disabled className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image et actions */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-6">
              {/* Image skeleton */}
              <Skeleton className="w-full aspect-5/7 rounded-lg mb-4" />

              {/* Actions skeleton */}
              <div className="space-y-2 mb-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Prix skeleton */}
              <div className="pt-6 border-t border-muted">
                <Skeleton className="h-5 w-32 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>

              {/* Liens externes skeleton */}
              <div className="mt-6 space-y-2">
                <Button variant="outline" className="w-full" disabled>
                  <ExternalLink className="size-4 mr-2" />
                  <Skeleton className="h-4 w-32" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informations détaillées */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations principales */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-9 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Informations de set */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Légalités */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
