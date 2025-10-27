"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
  const { data: session, status } = useSession();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Mes Collections
            </h1>
            <p className="text-slate-600">
              Organisez vos cartes en collections personnalisées
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowNewCollectionForm(!showNewCollectionForm)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Nouvelle collection
          </Button>
        </div>

        {/* New Collection Form */}
        {showNewCollectionForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Créer une nouvelle collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optionnelle)
                  </label>
                  <Input
                    type="text"
                    placeholder="Description de votre collection..."
                    value={newCollectionDescription}
                    onChange={(e) =>
                      setNewCollectionDescription(e.target.value)
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateCollection} disabled={creating}>
                    {creating ? "Création..." : "Créer la collection"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewCollectionForm(false);
                      setNewCollectionName("");
                      setNewCollectionDescription("");
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Collections Grid */}
        {collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <BookOpen className="h-6 w-6 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">
                          {collection.name}
                        </CardTitle>
                        {collection.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {collection.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="font-medium">
                        {collection._count.cards} carte
                        {collection._count.cards !== 1 ? "s" : ""}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          collection.isPublic
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {collection.isPublic ? "Public" : "Privé"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/collections/${collection.id}`}
                        className="flex-1"
                      >
                        <Button variant="outline" className="w-full">
                          <BookOpen className="mr-2 h-4 w-4" />
                          Voir
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCollection(collection.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Aucune collection
              </h3>
              <p className="text-gray-500 mb-6">
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
    </div>
  );
}
