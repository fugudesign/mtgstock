import { fetchWithRetry } from "@/lib/rate-limiter";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    // Construire l'URL avec tous les paramètres
    const url = new URL("https://api.scryfall.com/cards/search");
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    // Utiliser fetchWithRetry qui inclut le throttling et la gestion des 429
    const response = await fetchWithRetry(url.toString());

    if (!response.ok) {
      // 404 = pas de résultats
      if (response.status === 404) {
        return NextResponse.json(
          { data: [], total_cards: 0, has_more: false },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch search results" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
