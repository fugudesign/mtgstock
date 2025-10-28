import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  // Si l'utilisateur n'est pas authentifié et essaie d'accéder à une route protégée
  if (!token) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Protection des routes sensibles
export const config = {
  matcher: [
    "/search/:path*",
    "/cards/:path*",
    "/collections/:path*",
    "/decks/:path*",
    "/profile/:path*",
  ],
};
