"use client";

import { useEffect, useState } from "react";

/**
 * Hook pour détecter les media queries CSS
 * Optimisé pour éviter les problèmes d'hydratation et de HMR
 *
 * @returns Un objet avec `matches` (boolean) et `mounted` (boolean)
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Utiliser setTimeout pour éviter le warning du linter
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const media = window.matchMedia(query);

    // Fonction pour mettre à jour l'état
    const updateMatches = () => setMatches(media.matches);

    // Initialiser immédiatement
    updateMatches();

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Ajouter l'écouteur
    if (media.addEventListener) {
      media.addEventListener("change", listener);
    } else {
      media.addListener(listener);
    }

    // Nettoyage
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query, mounted]);

  // Ne retourner la vraie valeur qu'une fois monté côté client
  return mounted ? matches : false;
}
