import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartLine } from "lucide-react";

interface ProfileStatsProps {
  stats: {
    collections: number;
    decks: number;
  };
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartLine className="text-primary" />
          Statistiques
        </CardTitle>
        <CardDescription>Votre activité sur Magic Stack</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {stats.collections}
            </div>
            <div className="text-sm text-muted-foreground">Collections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.decks}</div>
            <div className="text-sm text-muted-foreground">Decks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">0</div>
            <div className="text-sm text-muted-foreground">Cartes</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
