"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hook pour détecter quand un élément sticky est "stuck" (collé)
 * Utilise un scroll listener pour comparer les positions
 *
 * @returns [ref, isStuck] - ref à attacher à l'élément, et booléen indiquant s'il est stuck
 */
export function useSticky<T extends HTMLElement = HTMLDivElement>() {
  const [isStuck, setIsStuck] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const checkSticky = () => {
      const rect = element.getBoundingClientRect();
      const stickyTop = parseInt(getComputedStyle(element).top) || 0;

      // L'élément est stuck si sa position top est exactement égale à la valeur de sticky top
      setIsStuck(rect.top <= stickyTop);
    };

    // Écouter le scroll avec throttle pour les performances
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkSticky();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", checkSticky, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkSticky);
    };
  }, []);

  return [ref, isStuck] as const;
}
