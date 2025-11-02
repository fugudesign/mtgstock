import { CardDetailClient } from "@/components/cards/CardDetailClient";
import { auth } from "@/lib/auth";
import { MTGCard } from "@/lib/scryfall-api";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchCardData(
  cardId: string,
  userLang: string | null
): Promise<MTGCard | null> {
  try {
    // Récupérer la carte directement depuis Scryfall (évite les problèmes d'URL)
    const response = await fetch(`https://api.scryfall.com/cards/${cardId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const fetchedCard: MTGCard = await response.json();

    // Si la carte est déjà dans la bonne langue ou pas de langue utilisateur
    if (!userLang || fetchedCard.lang === userLang || userLang === "en") {
      return fetchedCard;
    }

    // Chercher la version dans la langue de l'utilisateur via l'oracle_id
    try {
      const searchUrl = `https://api.scryfall.com/cards/search?q=oracleid:${fetchedCard.oracle_id}+lang:${userLang}&unique=prints`;
      const localizedResponse = await fetch(searchUrl, { cache: "no-store" });

      if (localizedResponse.ok) {
        const localizedData = await localizedResponse.json();

        if (localizedData.data && localizedData.data.length > 0) {
          // Chercher une carte du même set si possible
          const sameSetCard = localizedData.data.find(
            (c: MTGCard) => c.set === fetchedCard.set
          );
          return sameSetCard || localizedData.data[0];
        }
      }
    } catch (error) {
      console.error("Error fetching localized card:", error);
    }

    // Fallback: retourner la carte d'origine
    return fetchedCard;
  } catch (error) {
    console.error("Error fetching card:", error);
    return null;
  }
}

export default async function CardDetailPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;

  // Optionnel: rediriger si non authentifié (ou laisser l'accès public)
  if (!session) {
    redirect("/auth/login");
  }

  // Récupérer la langue de l'utilisateur si connecté
  let userLang: string | null = null;
  if (session?.user?.id) {
    try {
      // Récupérer directement depuis la base de données au lieu d'un fetch API
      const { prisma } = await import("@/lib/prisma");
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { language: true },
      });
      userLang = user?.language || "en";
    } catch (error) {
      console.error("Error fetching user language:", error);
      userLang = "en";
    }
  }

  // Récupérer les données de la carte
  const card = await fetchCardData(id, userLang);

  if (!card) {
    notFound();
  }

  return <CardDetailClient card={card} />;
}
