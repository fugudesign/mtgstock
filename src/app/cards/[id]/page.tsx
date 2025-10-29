"use client";

import { DeckSelector } from "@/components/DeckSelector";
import { ManaSymbols, ManaText } from "@/components/ManaSymbol";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MTGCard,
  getCardFaceImages,
  getCardName,
  getCardOracleText,
  getCardTypeLine,
  isDoubleFacedCard,
} from "@/lib/scryfall-api";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ExternalLink,
  Heart,
  Layers,
  TrendingUp,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Collection {
  id: string;
  name: string;
}

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [card, setCard] = useState<MTGCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [showDeckSelector, setShowDeckSelector] = useState(false);
  const [adding, setAdding] = useState(false);
  const [userLang, setUserLang] = useState<string | null>(null);
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);

  // Récupérer la langue de l'utilisateur
  useEffect(() => {
    const fetchUserLanguage = async () => {
      if (session) {
        try {
          const response = await fetch("/api/user/profile");
          if (response.ok) {
            const data = await response.json();
            setUserLang(data.language || "en");
          } else {
            setUserLang("en");
          }
        } catch (error) {
          console.error("Error fetching user language:", error);
          setUserLang("en");
        }
      } else {
        setUserLang("en");
      }
    };

    fetchUserLanguage();
  }, [session]);

  useEffect(() => {
    const fetchCard = async () => {
      if (!userLang) return; // Attendre que la langue soit chargée

      try {
        // Récupérer la carte par son ID
        const response = await fetch(`/api/scryfall/cards/${params.id}`);
        if (!response.ok) {
          toast.error("Carte introuvable");
          router.push("/search");
          return;
        }

        const fetchedCard = await response.json();
        console.log(
          "Carte récupérée:",
          fetchedCard.name,
          "Lang:",
          fetchedCard.lang,
          "User lang:",
          userLang
        );

        // Si la carte est déjà dans la bonne langue, l'utiliser directement
        if (fetchedCard.lang === userLang) {
          console.log("Carte déjà dans la langue demandée");
          setCard(fetchedCard);
          setLoading(false);
          return;
        }

        // Sinon, chercher la version dans la langue de l'utilisateur
        if (userLang !== "en") {
          try {
            // Attendre un peu pour respecter le rate limiting de Scryfall
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Chercher la version dans la langue de l'utilisateur via l'oracle_id
            const searchUrl = `/api/scryfall/search?q=oracleid:${fetchedCard.oracle_id}+lang:${userLang}&unique=prints`;
            console.log("Recherche URL:", searchUrl);

            const localizedResponse = await fetch(searchUrl);

            if (localizedResponse.ok) {
              const localizedData = await localizedResponse.json();
              console.log(
                "Résultats localisés:",
                localizedData.total_cards,
                "cartes trouvées"
              );

              // Prendre la première carte trouvée dans la langue demandée
              if (localizedData.data && localizedData.data.length > 0) {
                // Chercher une carte du même set si possible
                const sameSetCard = localizedData.data.find(
                  (c: MTGCard) => c.set === fetchedCard.set
                );
                const selectedCard = sameSetCard || localizedData.data[0];
                console.log(
                  "Carte sélectionnée:",
                  selectedCard.name,
                  "Set:",
                  selectedCard.set,
                  "Lang:",
                  selectedCard.lang
                );
                setCard(selectedCard);
              } else {
                // Si pas de version localisée, utiliser la version récupérée
                console.log(
                  "Aucune version localisée trouvée, utilisation de la version récupérée"
                );
                setCard(fetchedCard);
              }
            } else {
              console.log(
                "Erreur lors de la recherche localisée:",
                localizedResponse.status
              );
              setCard(fetchedCard);
            }
          } catch (error) {
            console.error("Error fetching localized card:", error);
            setCard(fetchedCard);
          }
        } else {
          setCard(fetchedCard);
        }
      } catch (error) {
        console.error("Error fetching card:", error);
        toast.error("Erreur lors du chargement de la carte");
      } finally {
        setLoading(false);
      }
    };

    if (params.id && userLang !== null) {
      fetchCard();
    }
  }, [params.id, router, userLang]);

  useEffect(() => {
    const fetchCollections = async () => {
      if (session) {
        try {
          const response = await fetch("/api/collections");
          if (response.ok) {
            const data = await response.json();
            setCollections(data);
          }
        } catch (error) {
          console.error("Error fetching collections:", error);
        }
      }
    };

    fetchCollections();
  }, [session]);

  const handleAddToCollection = async (collectionId: string) => {
    if (!card) return;

    setAdding(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardData: card,
          quantity: 1,
          foil: false,
          condition: "nm",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowCollectionMenu(false);
      }
    } catch (error) {
      console.error("Error adding card to collection:", error);
      toast.error("Erreur lors de l'ajout de la carte");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return null;
  }

  const getImageUrl = () => {
    const faceImages = getCardFaceImages(card);
    if (faceImages.length > 0) {
      return faceImages[currentFaceIndex]?.image || faceImages[0].image;
    }
    if (card.image_uris?.large) return card.image_uris.large;
    if (card.image_uris?.normal) return card.image_uris.normal;
    if (card.card_faces?.[0]?.image_uris?.large)
      return card.card_faces[0].image_uris.large;
    if (card.card_faces?.[0]?.image_uris?.normal)
      return card.card_faces[0].image_uris.normal;
    return "/placeholder-card.svg";
  };

  const getManaCost = () => {
    if (card.mana_cost) return card.mana_cost;
    if (card.card_faces?.[0]?.mana_cost) return card.card_faces[0].mana_cost;
    return "";
  };

  const getColorIdentity = () => {
    const colors: { [key: string]: string } = {
      W: "Blanc",
      U: "Bleu",
      B: "Noir",
      R: "Rouge",
      G: "Vert",
    };
    return (
      card.color_identity?.map((c) => colors[c] || c).join(", ") || "Incolore"
    );
  };

  const getRarityColor = (rarity: string) => {
    const colors: { [key: string]: string } = {
      common: "bg-gray-600",
      uncommon: "bg-slate-400",
      rare: "bg-yellow-600",
      mythic: "bg-orange-600",
    };
    return colors[rarity] || "bg-gray-500";
  };

  const getRarityLabel = (rarity: string) => {
    const labels: { [key: string]: string } = {
      common: "Commune",
      uncommon: "Inhabituelle",
      rare: "Rare",
      mythic: "Mythique",
    };
    return labels[rarity] || rarity;
  };

  const cardFaces = getCardFaceImages(card);
  const isDoubleFaced = isDoubleFacedCard(card);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className=" mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image et actions */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <div className="relative mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={getImageUrl()}
                      alt={card.name}
                      width={488}
                      height={680}
                      className="w-full h-auto"
                      priority
                    />

                    {/* Indicateur et boutons pour les cartes double-face */}
                    {isDoubleFaced && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                        {cardFaces.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentFaceIndex(index)}
                            className={cn(
                              "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                              currentFaceIndex === index
                                ? "bg-primary text-white shadow-lg"
                                : "bg-white/90 text-gray-700 hover:bg-white"
                            )}
                          >
                            Face {index + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Nom de la face actuelle pour les cartes double-face */}
                  {isDoubleFaced && cardFaces[currentFaceIndex] && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium text-center">
                        {cardFaces[currentFaceIndex].name}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {session && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() =>
                            setShowCollectionMenu(!showCollectionMenu)
                          }
                          disabled={adding}
                        >
                          <Heart className="mr-2 h-4 w-4" />
                          Ajouter à une collection
                        </Button>

                        {showCollectionMenu && collections.length > 0 && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowCollectionMenu(false)}
                            />
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                              {collections.map((collection) => (
                                <button
                                  key={collection.id}
                                  onClick={() =>
                                    handleAddToCollection(collection.id)
                                  }
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                                  disabled={adding}
                                >
                                  {collection.name}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => setShowDeckSelector(true)}
                      >
                        <Layers className="mr-2 h-4 w-4" />
                        Ajouter à un deck
                      </Button>
                    </div>
                  )}

                  {/* Prix et liens */}
                  {card.prices && (
                    <div className="mt-6 pt-6 border-t border-muted">
                      <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Prix estimés
                      </h3>
                      <div className="space-y-2 text-sm">
                        {card.prices.eur && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">EUR:</span>
                            <span className="font-semibold">
                              {card.prices.eur}€
                            </span>
                          </div>
                        )}
                        {card.prices.eur_foil && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              EUR (Foil):
                            </span>
                            <span className="font-semibold">
                              {card.prices.eur_foil}€
                            </span>
                          </div>
                        )}
                        {card.prices.usd && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">USD:</span>
                            <span className="font-semibold">
                              ${card.prices.usd}
                            </span>
                          </div>
                        )}
                        {card.prices.usd_foil && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              USD (Foil):
                            </span>
                            <span className="font-semibold">
                              ${card.prices.usd_foil}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Liens externes */}
                  <div className="mt-6 space-y-2">
                    {card.scryfall_uri && (
                      <Button asChild variant="outline" className="w-full">
                        <a
                          href={card.scryfall_uri}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="size-4 mr-2" />
                          Voir sur Scryfall
                        </a>
                      </Button>
                    )}
                    {card.related_uris?.gatherer && (
                      <Button asChild variant="outline" className="w-full">
                        <a
                          href={card.related_uris.gatherer}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="size-4 mr-2" />
                          Voir sur Gatherer
                        </a>
                      </Button>
                    )}
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
                    <div className="flex-1">
                      <CardTitle className="text-3xl mb-2">
                        {getCardName(card)}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getRarityColor(card.rarity)}>
                          {getRarityLabel(card.rarity)}
                        </Badge>
                        {card.lang && (
                          <Badge variant="outline">
                            {card.lang.toUpperCase()}
                          </Badge>
                        )}
                        {card.foil && (
                          <Badge variant="secondary">Foil disponible</Badge>
                        )}
                        {card.nonfoil && (
                          <Badge variant="secondary">Non-foil disponible</Badge>
                        )}
                      </div>
                    </div>
                    {getManaCost() && (
                      <div className="flex items-center">
                        <ManaSymbols manaCost={getManaCost()} size={24} />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground mb-2">
                      Type
                    </h3>
                    <p className="text-muted-foreground">
                      {getCardTypeLine(card)}
                    </p>
                  </div>

                  {getCardOracleText(card) && (
                    <div>
                      <h3 className="font-semibold text-sm text-foreground mb-2">
                        Texte d&apos;oracle
                      </h3>
                      <div className="text-muted-foreground">
                        <ManaText
                          text={getCardOracleText(card)}
                          symbolSize={18}
                          className="whitespace-pre-wrap"
                        />
                      </div>
                    </div>
                  )}

                  {card.flavor_text && (
                    <div>
                      <h3 className="font-semibold text-sm text-foreground mb-2">
                        Texte d&apos;ambiance
                      </h3>
                      <p className="text-muted-foreground italic">
                        {card.flavor_text}
                      </p>
                    </div>
                  )}

                  {(card.power || card.toughness) && (
                    <div>
                      <h3 className="font-semibold text-sm text-foreground mb-2">
                        Force / Endurance
                      </h3>
                      <p className="text-muted-foreground">
                        {card.power} / {card.toughness}
                      </p>
                    </div>
                  )}

                  {card.loyalty && (
                    <div>
                      <h3 className="font-semibold text-sm text-foreground mb-2">
                        Loyauté
                      </h3>
                      <p className="text-muted-foreground">{card.loyalty}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informations de set */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations de l&apos;édition</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-sm text-foreground mb-1">
                        Édition
                      </h3>
                      <p className="text-muted-foreground">{card.set_name}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground mb-1">
                        Code de l&apos;édition
                      </h3>
                      <p className="text-muted-foreground uppercase">
                        {card.set}
                      </p>
                    </div>
                    {card.collector_number && (
                      <div>
                        <h3 className="font-semibold text-sm text-foreground mb-1">
                          Numéro de collection
                        </h3>
                        <p className="text-muted-foreground">
                          {card.collector_number}
                        </p>
                      </div>
                    )}
                    {card.released_at && (
                      <div>
                        <h3 className="font-semibold text-sm text-foreground mb-1">
                          Date de sortie
                        </h3>
                        <p className="text-muted-foreground">
                          {new Date(card.released_at).toLocaleDateString(
                            "fr-FR"
                          )}
                        </p>
                      </div>
                    )}
                    {card.artist && (
                      <div>
                        <h3 className="font-semibold text-sm text-foreground mb-1">
                          Artiste
                        </h3>
                        <p className="text-muted-foreground">{card.artist}</p>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-sm text-foreground mb-1">
                        Identité de couleur
                      </h3>
                      <p className="text-muted-foreground">
                        {getColorIdentity()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Légalités */}
              {card.legalities && (
                <Card>
                  <CardHeader>
                    <CardTitle>Légalités</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(card.legalities).map(
                        ([format, status]) => {
                          if (status === "not_legal") return null;

                          const statusColors: { [key: string]: string } = {
                            legal:
                              "bg-green-700/20 text-green-300 border-green-700",
                            banned: "bg-red-700/20 text-red-300 border-red-700",
                            restricted:
                              "bg-orange-700/20 text-orange-300 border-orange-700",
                          };

                          const statusLabels: { [key: string]: string } = {
                            legal: "Légal",
                            banned: "Banni",
                            restricted: "Restreint",
                          };

                          return (
                            <div
                              key={format}
                              className={cn(
                                "px-3 py-2 rounded-md border",
                                statusColors[status] ||
                                  "bg-gray-100 text-gray-700 border-gray-300"
                              )}
                            >
                              <p className="font-semibold text-xs uppercase">
                                {format.replace("_", " ")}
                              </p>
                              <p className="text-sm">
                                {statusLabels[status] || status}
                              </p>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Rulings */}
              {card.keywords && card.keywords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Mots-clés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {card.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Deck Selector Modal */}
          {card && (
            <DeckSelector
              card={card}
              isOpen={showDeckSelector}
              onClose={() => setShowDeckSelector(false)}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
