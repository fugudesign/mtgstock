import { fetchWithRetry } from "@/lib/rate-limiter";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Utiliser fetchWithRetry qui inclut le throttling et la gestion des 429
    const response = await fetchWithRetry(
      `https://api.scryfall.com/cards/${id}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=3600", // Cache 1h
      },
    });
  } catch (error) {
    console.error("Error proxying card fetch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
