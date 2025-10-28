"use client";

import { CardDisplay } from "@/components/CardDisplay";
import { MtgStockIcon } from "@/components/icons/MtgStockIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mtgApiService, MTGCard } from "@/lib/scryfall-api";
import { BookOpen, Layers, LogIn, Search, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const { status } = useSession();
  const [featuredCards, setFeaturedCards] = useState<MTGCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedCards = async () => {
      try {
        setLoading(true);
        const cards = await mtgApiService.getRandomCards(8);
        setFeaturedCards(cards);
      } catch (error) {
        console.error("Erreur lors du chargement des cartes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedCards();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 h-lvh flex flex-col justify-center items-center bg-radial from-background to-neutral-950">
        <MtgStockIcon
          size={800}
          className="absolute z-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10  mb-6 text-indigo-600"
        />
        <div className="max-w-8xl mx-auto text-center">
          <h1 className="font-decorative text-9xl  bg-clip-text bg-linear-to-br from-indigo-600 to-purple-700 text-transparent drop-shadow-md mb-2">
            Magic Stack
          </h1>
          <p className="text-xs tracking-[14px] text-foreground uppercase mb-8">
            The cards gathering
          </p>
          <p className="text-lg text-accent-foreground/40 mb-8 max-w-2xl mx-auto">
            Gérez vos collections et decks Magic The Gathering avec style.
            <br />
            Recherchez parmi des milliers de cartes et organisez votre passion.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {status === "authenticated" ? (
              <>
                <Link href="/search">
                  <Button
                    size="lg"
                    variant="magic"
                    className="w-full sm:w-auto"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Rechercher des cartes
                  </Button>
                </Link>
                <Link href="/collections">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto "
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    Mes collections
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    variant="magic"
                    className="w-full sm:w-auto"
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    Se connecter
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto "
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Créer un compte
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Fonctionnalités
          </h2>

          {status === "unauthenticated" && (
            <div className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
              <p className="text-foreground">
                <strong>Connectez-vous</strong> pour accéder à toutes les
                fonctionnalités !
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                La recherche de cartes, les collections et les decks nécessitent
                une authentification.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Search className="h-10 w-10 text-indigo-600 mb-4" />
                <CardTitle>Recherche avancée</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Recherchez parmi plus de 30 000 cartes Magic avec des filtres
                  avancés par nom, coût, couleur, rareté et plus encore.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="h-10 w-10 text-green-600 mb-4" />
                <CardTitle>Collections personnelles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Organisez vos cartes en collections personnalisées. Suivez vos
                  cartes par état, quantité et notes personnelles.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Layers className="h-10 w-10 text-purple-600 mb-4" />
                <CardTitle>Gestion de decks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Créez et gérez vos decks pour différents formats. Mainboard,
                  sideboard et notes stratégiques incluses.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Cards Section */}
      <section className="py-16 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center mb-12">
            <Sparkles className="h-6 w-6 text-yellow-500 mr-2" />
            <h2 className="text-3xl font-bold text-foreground">
              Cartes en vedette
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[5/7] bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {featuredCards.map((card) => (
                <CardDisplay key={card.id} card={card} showActions={false} />
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/search">
              <Button variant="outline">Voir plus de cartes</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary-dark text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Prêt à organiser votre collection ?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Rejoignez MTG Stock dès aujourd&apos;hui et donnez une nouvelle
            dimension à votre passion pour Magic: The Gathering.
          </p>
          <Link href="/api/auth/signin">
            <Button size="lg" variant="secondary">
              Commencer maintenant
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
