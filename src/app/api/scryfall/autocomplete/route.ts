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

    const response = await fetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(
        query
      )}`
    );

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
