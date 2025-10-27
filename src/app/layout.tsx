import { Navigation } from "@/components/Navigation";
import { Providers } from "@/components/Providers";
import type { Metadata } from "next";
import { Geist_Mono, Lexend } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const lexendSans = Lexend({
  variable: "--font-lexend-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MTG Stock - Gérez vos cartes Magic: The Gathering",
  description:
    "Application de gestion de collections et decks Magic: The Gathering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Remove browser extension attributes before React hydration
                if (typeof window !== 'undefined') {
                  window.addEventListener('DOMContentLoaded', function() {
                    document.body.removeAttribute('cz-shortcut-listen');
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${lexendSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <Navigation />
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
