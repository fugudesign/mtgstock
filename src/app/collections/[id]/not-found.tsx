import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function CollectionNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-12 text-center">
          <div className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6">
            <BookOpen className="h-full w-full" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Collection introuvable</h3>
          <p className="text-muted-foreground mb-6">
            Cette collection n&apos;existe pas ou vous n&apos;y avez pas accès.
          </p>
          <Button asChild>
            <Link href="/collections">Retour aux collections</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
