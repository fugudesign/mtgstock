import { Navigation } from "@/components/Navigation";
import { Providers } from "@/components/Providers";
import { RecaptchaProvider } from "@/components/RecaptchaProvider";
import type { Metadata } from "next";
import {
  Cinzel_Decorative,
  Geist_Mono,
  Gloock,
  Lexend,
} from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const lexendSans = Lexend({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-decorative",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const gloock = Gloock({
  variable: "--font-heading",
  weight: ["400"],
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
        className={`${lexendSans.variable} ${geistMono.variable} ${cinzelDecorative.variable} ${gloock.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <RecaptchaProvider>
            <Navigation />
            <main className="pt-12">{children}</main>
            <Toaster position="top-right" richColors />
          </RecaptchaProvider>
        </Providers>
      </body>
    </html>
  );
}
