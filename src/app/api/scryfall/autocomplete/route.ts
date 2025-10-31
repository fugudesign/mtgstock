import { fetchWithRetry } from "@/lib/rate-limiter";
import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy pour l'API autocomplete de Scryfall
 * Note: L'API Scryfall autocomplete ne supporte pas la multilinguisme.
 * Elle retourne uniquement des noms de cartes en anglais.
 * Pour une autosuggestion multilingue, il faudrait créer notre propre index.
 */
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

    // L'API Scryfall autocomplete ne supporte que l'anglais
    const autocompleteUrl = `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(
      query
    )}`;

    // Utiliser fetchWithRetry qui inclut le throttling et la gestion des 429
    const response = await fetchWithRetry(autocompleteUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch autocomplete" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=300", // Cache 5min
      },
    });
  } catch (error) {
    console.error("Error proxying autocomplete:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
