"use client";

import { CreateModal } from "@/components/CreateModal";
import { ItemCard } from "@/components/ItemCard";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Layers,
  Plus,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Deck {
  id: string;
  name: string;
  description: string | null;
  format: string;
  cardCount: number;
  createdAt: string;
}

const defaultDeckFormat = "standard";

export default function DecksPage() {
  const { status } = useSession();
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");
  const [newDeckFormat, setNewDeckFormat] = useState(defaultDeckFormat);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      fetchDecks();
    }
  }, [status, router]);

  const fetchDecks = async () => {
    try {
      const response = await fetch("/api/decks");
      if (response.ok) {
        const data = await response.json();
        setDecks(data);
      }
    } catch (error) {
      console.error("Error fetching decks:", error);
      toast.error("Erreur lors du chargement des decks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) {
      toast.error("Le nom du deck est requis");
      return;
    }

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newDeckName,
          description: newDeckDescription || null,
          format: newDeckFormat,
        }),
      });

      if (response.ok) {
        toast.success("Deck créé avec succès");
        setNewDeckName("");
        setNewDeckDescription("");
        setNewDeckFormat(defaultDeckFormat);
        setShowNewDeckForm(false);
        fetchDecks();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la création du deck");
      }
    } catch (error) {
      console.error("Error creating deck:", error);
      toast.error("Erreur lors de la création du deck");
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce deck ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Deck supprimé");
        fetchDecks();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting deck:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getDeckStatus = (cardCount: number) => {
    if (cardCount < 60) {
      return {
        label: `${cardCount}/60 - Incomplet`,
        color: "bg-orange-500/20 text-orange-400 border-orange-500",
        icon: AlertCircle,
      };
    } else if (cardCount >= 60 && cardCount <= 100) {
      return {
        label: `${cardCount} cartes - Valide`,
        color: "bg-green-500/20 text-green-400 border-green-500",
        icon: CheckCircle2,
      };
    } else {
      return {
        label: `${cardCount}/100 - Trop de cartes`,
        color: "bg-orange-500/20 text-orange-400 border-orange-500",
        icon: AlertCircle,
      };
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen py-8">
        <div className=" mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-neutral-800 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-neutral-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <div className="space-y-4 mx-auto p-4">
          <PageHeader
            title="Mes Decks"
            subtitle="Construisez vos decks compétitifs (60-100 cartes, max 4 copies par carte)"
          >
            <Button size="sm" onClick={() => setShowNewDeckForm(true)}>
              <Plus />
              <span data-slot="text">Nouveau deck</span>
            </Button>
          </PageHeader>

          {/* Decks Grid */}
          {decks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck) => {
                const status = getDeckStatus(deck.cardCount);
                const StatusIcon = status.icon;

                return (
                  <ItemCard
                    key={deck.id}
                    title={deck.name}
                    description={deck.description}
                    icon={Layers}
                    iconColor="text-purple-600"
                    href={`/decks/${deck.id}`}
                    badges={
                      <>
                        <Badge variant="outline" className="capitalize">
                          {deck.format}
                        </Badge>
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${status.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          <span>{status.label}</span>
                        </div>
                      </>
                    }
                    metadata={
                      <span className="text-sm text-muted-foreground font-medium">
                        {deck.cardCount} carte{deck.cardCount !== 1 ? "s" : ""}
                      </span>
                    }
                    onDelete={() => handleDeleteDeck(deck.id)}
                  />
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Layers className="h-16 w-16 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-accent mb-2">
                  Aucun deck
                </h3>
                <p className="text-muted-foreground mb-6">
                  Créez votre premier deck pour commencer à construire votre
                  stratégie
                </p>
                <Button onClick={() => setShowNewDeckForm(true)}>
                  <Plus className="mr-2 h-5 w-5" />
                  Créer mon premier deck
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Deck Modal */}
        <CreateModal
          isOpen={showNewDeckForm}
          onClose={() => {
            setShowNewDeckForm(false);
            setNewDeckName("");
            setNewDeckDescription("");
            setNewDeckFormat("casual");
          }}
          title="Créer un nouveau deck"
          onSubmit={handleCreateDeck}
          submitLabel="Créer le deck"
          isSubmitting={false}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nom du deck
              </label>
              <Input
                type="text"
                placeholder="ex: Mon Deck Aggro Rouge"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Description (optionnelle)
              </label>
              <Input
                type="text"
                placeholder="Description de votre deck..."
                value={newDeckDescription}
                onChange={(e) => setNewDeckDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Format</label>
              <div className="relative">
                <select
                  value={newDeckFormat}
                  onChange={(e) => setNewDeckFormat(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                >
                  <option value="casual">Casual</option>
                  <option value="standard">Standard</option>
                  <option value="modern">Modern</option>
                  <option value="commander">Commander</option>
                  <option value="legacy">Legacy</option>
                  <option value="vintage">Vintage</option>
                  <option value="pauper">Pauper</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </CreateModal>
      </div>
    </ProtectedRoute>
  );
}
