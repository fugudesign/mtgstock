"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  TrendingDown,
  TrendingUp as TrendingFlat,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PriceData {
  cardId: string;
  price: number;
  priceFoil: number | null;
  currency: string;
  priceChange: "up" | "down" | "stable" | null;
  priceChangePercent: number | null;
  lastChecked: string;
  noPriceAvailable?: boolean;
  ownedIn: {
    collections: Array<{
      id: string;
      name: string;
      quantity: number;
      foil: boolean;
    }>;
    decks: Array<{ id: string; name: string; quantity: number }>;
  };
}

interface PriceTrackerProps {
  cardId: string;
}

export function PriceTracker({ cardId }: PriceTrackerProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchPrice = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const url = forceRefresh
        ? `/api/cards/${cardId}/price?refresh=true`
        : `/api/cards/${cardId}/price`;

      const response = await fetch(url);

      if (response.status === 404) {
        // L'utilisateur ne possède pas cette carte
        setError(true);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch price");
      }

      const data = await response.json();
      setPriceData(data);

      if (forceRefresh) {
        toast.success("Prix mis à jour");
      }
    } catch (error) {
      console.error("Error fetching price:", error);
      toast.error("Erreur lors du chargement du prix");
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (error || !priceData) {
    return null; // Ne rien afficher si l'utilisateur ne possède pas la carte
  }

  const getPriceChangeIcon = () => {
    switch (priceData.priceChange) {
      case "up":
        return <TrendingUp className="h-4 w-4" />;
      case "down":
        return <TrendingDown className="h-4 w-4" />;
      case "stable":
        return <TrendingFlat className="h-4 w-4 rotate-90" />;
      default:
        return null;
    }
  };

  const getPriceChangeBadge = () => {
    if (!priceData.priceChange || priceData.priceChangePercent === null) {
      return null;
    }

    const variants = {
      up: "destructive" as const, // Rouge = hausse (mauvais)
      down: "default" as const, // Vert = baisse (bon)
      stable: "secondary" as const, // Gris = stable
    };

    const labels = {
      up: `+${priceData.priceChangePercent}%`,
      down: `${priceData.priceChangePercent}%`,
      stable: "Stable",
    };

    return (
      <Badge variant={variants[priceData.priceChange]} className="gap-1">
        {getPriceChangeIcon()}
        {labels[priceData.priceChange]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return "à l'instant";
    } else if (diffHours < 24) {
      return `il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return "hier";
    } else {
      return `il y a ${diffDays}j`;
    }
  };

  return (
    <div className="border-t border-muted pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-foreground">
          Prix suivi (votre collection)
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchPrice(true)}
          disabled={refreshing}
          className="h-8 w-8"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {priceData.noPriceAvailable ? (
        <div className="text-sm text-muted-foreground">
          Aucun prix disponible pour cette carte sur Scryfall
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-foreground">
              {priceData.currency === "EUR" ? "€" : "$"}
              {priceData.price.toFixed(2)}
            </span>
            {getPriceChangeBadge()}
          </div>

          {priceData.priceFoil && (
            <div className="text-sm text-muted-foreground mb-2">
              Foil: {priceData.currency === "EUR" ? "€" : "$"}
              {priceData.priceFoil.toFixed(2)}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Dernière vérification: {formatDate(priceData.lastChecked)}
          </p>
        </>
      )}

      {/* Afficher où la carte est possédée */}
      {(priceData.ownedIn.collections.length > 0 ||
        priceData.ownedIn.decks.length > 0) && (
        <div className="mt-3 pt-3 border-t border-muted">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Vous possédez cette carte dans:
          </p>
          <div className="space-y-1">
            {priceData.ownedIn.collections.map((col) => (
              <div key={col.id} className="text-xs text-muted-foreground">
                • {col.name} ({col.quantity}x{col.foil ? " foil" : ""})
              </div>
            ))}
            {priceData.ownedIn.decks.map((deck) => (
              <div key={deck.id} className="text-xs text-muted-foreground">
                • {deck.name} ({deck.quantity}x)
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
