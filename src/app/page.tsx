"use client";

import { CardDisplay } from "@/components/CardDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mtgApiService, MTGCard } from "@/lib/scryfall-api";
import { BookOpen, Layers, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">MTG Stock</h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Gérez vos collections et decks Magic: The Gathering avec style.
            Recherchez parmi des milliers de cartes et organisez votre passion.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button size="lg" className="w-full sm:w-auto">
                <Search className="mr-2 h-5 w-5" />
                Rechercher des cartes
              </Button>
            </Link>
            <Link href="/collections">
              <Button variant="outline" size="lg" className="w-full sm:w-auto ">
                <BookOpen className="mr-2 h-5 w-5" />
                Mes collections
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Fonctionnalités
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Search className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Recherche avancée</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
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
                <p className="text-slate-600">
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
                <p className="text-slate-600">
                  Créez et gérez vos decks pour différents formats. Mainboard,
                  sideboard et notes stratégiques incluses.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Cards Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center mb-12">
            <Sparkles className="h-6 w-6 text-yellow-500 mr-2" />
            <h2 className="text-3xl font-bold text-slate-900">
              Cartes en vedette
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[5/7] bg-slate-200 rounded-lg animate-pulse"
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
      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Prêt à organiser votre collection ?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
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
