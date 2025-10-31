import { Navigation } from "@/components/Navigation";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
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
  title: "Magic Stack - Gérez vos cartes Magic: The Gathering",
  description:
    "Application de gestion de collections et decks Magic: The Gathering",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  manifest: "/manifest.json",
  themeColor: "#171717",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Magic Stack",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Magic Stack" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/icon-32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/icon-16.png"
        />

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
                
                // Register service worker for PWA
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${lexendSans.variable} ${geistMono.variable} ${cinzelDecorative.variable} ${gloock.variable} antialiased bg-radial from-background to-background-dark bg-fixed`}
        suppressHydrationWarning
      >
        <Providers>
          <RecaptchaProvider>
            <Navigation />
            <main className="pt-16 mb-16 md:pb-8">{children}</main>
            <PWAInstallPrompt />
            <Toaster position="top-right" richColors />
          </RecaptchaProvider>
        </Providers>
      </body>
    </html>
  );
}
