import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://api.scryfall.com/symbology");

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch symbology" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=86400", // Cache 24h
      },
    });
  } catch (error) {
    console.error("Error proxying symbology:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
