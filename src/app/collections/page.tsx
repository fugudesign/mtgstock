"use client";

import { CreateModal } from "@/components/CreateModal";
import { ItemCard } from "@/components/ItemCard";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Collection {
  id: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: string;
  _count: {
    cards: number;
  };
}

export default function CollectionsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      fetchCollections();
    }
  }, [status, router]);

  const fetchCollections = async () => {
    try {
      const response = await fetch("/api/collections");
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCollectionName,
          description: newCollectionDescription || null,
          isPublic: false,
        }),
      });

      if (response.ok) {
        const newCollection = await response.json();
        setCollections([newCollection, ...collections]);
        setNewCollectionName("");
        setNewCollectionDescription("");
        setShowNewCollectionForm(false);
      }
    } catch (error) {
      console.error("Error creating collection:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette collection ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCollections(collections.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen">
        <div className=" mx-auto px-4 py-8">
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
      <div className="min-h-screen ">
        <div className="space-y-4 mx-auto p4">
          <PageHeader
            title="Mes Collections"
            subtitle="Organisez vos cartes en collections personnalisées"
          >
            <Button size="sm" onClick={() => setShowNewCollectionForm(true)}>
              <Plus />
              <span data-slot="text">Nouvelle collection</span>
            </Button>
          </PageHeader>

          {/* Collections Grid */}
          {collections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <ItemCard
                  key={collection.id}
                  title={collection.name}
                  description={collection.description}
                  icon={BookOpen}
                  iconColor="text-blue-600"
                  href={`/collections/${collection.id}`}
                  badges={
                    <Badge
                      variant={collection.isPublic ? "default" : "secondary"}
                    >
                      {collection.isPublic ? "Public" : "Privé"}
                    </Badge>
                  }
                  metadata={
                    <span className="text-sm text-muted-foreground font-medium">
                      {collection._count.cards} carte
                      {collection._count.cards !== 1 ? "s" : ""}
                    </span>
                  }
                  onDelete={() => handleDeleteCollection(collection.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-16 w-16 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-accent mb-2">
                  Aucune collection
                </h3>
                <p className="text-muted-foreground mb-6">
                  Créez votre première collection pour commencer à organiser vos
                  cartes
                </p>
                <Button onClick={() => setShowNewCollectionForm(true)}>
                  <Plus className="mr-2 h-5 w-5" />
                  Créer ma première collection
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Collection Modal */}
        <CreateModal
          isOpen={showNewCollectionForm}
          onClose={() => {
            setShowNewCollectionForm(false);
            setNewCollectionName("");
            setNewCollectionDescription("");
          }}
          title="Créer une nouvelle collection"
          onSubmit={handleCreateCollection}
          submitLabel="Créer la collection"
          isSubmitting={creating}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nom de la collection
              </label>
              <Input
                type="text"
                placeholder="ex: Ma Collection Modern"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Description (optionnelle)
              </label>
              <Input
                type="text"
                placeholder="Description de votre collection..."
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
              />
            </div>
          </div>
        </CreateModal>
      </div>
    </ProtectedRoute>
  );
}
