"use client";

import { usePWA } from "@/hooks/usePWA";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export function PWAInstallPrompt() {
  const { isInstallable, installPWA, isPWA } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Afficher le prompt après un délai si l'app est installable
    if (isInstallable && !isPWA) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 10000); // Attendre 10 secondes avant d'afficher

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isPWA]);

  const handleInstall = async () => {
    await installPWA();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Ne plus afficher pendant cette session
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  // Ne pas afficher si déjà installé, pas installable, ou déjà refusé
  if (
    !showPrompt ||
    isPWA ||
    !isInstallable ||
    sessionStorage.getItem("pwa-prompt-dismissed")
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-card border border-border rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="shrink-0 p-2 bg-primary/10 rounded-full">
          <Download className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            Installer Magic Stack
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Accédez rapidement à vos cartes depuis votre écran d&apos;accueil
          </p>

          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleInstall} className="flex-1">
              <Download className="h-4 w-4 mr-1" />
              Installer
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
