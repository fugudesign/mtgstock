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
    // Récupérer la carte depuis l'API Scryfall
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/scryfall/cards/${cardId}`, {
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
      const searchUrl = `${baseUrl}/api/scryfall/search?q=oracleid:${fetchedCard.oracle_id}+lang:${userLang}&unique=prints`;
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
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const profileResponse = await fetch(`${baseUrl}/api/user/profile`, {
        headers: {
          cookie: `next-auth.session-token=${session}`,
        },
        cache: "no-store",
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        userLang = profileData.language || "en";
      }
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
