"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ManaSymbolProps {
  symbol: string;
  size?: number;
  className?: string;
}

// Cache pour les URIs des symboles
const symbolCache: { [key: string]: string } = {};
let symbolsLoaded = false;

/**
 * Composant pour afficher un symbole de mana MTG
 * Utilise l'API Scryfall pour récupérer les SVG des symboles
 * Exemples: {W}, {U}, {B}, {R}, {G}, {1}, {2}, {X}, {T}, {Q}, etc.
 */
export function ManaSymbol({
  symbol,
  size = 20,
  className = "",
}: ManaSymbolProps) {
  const [svgUri, setSvgUri] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadSymbols = async () => {
      // Si déjà en cache, utiliser directement
      if (symbolCache[symbol]) {
        setSvgUri(symbolCache[symbol]);
        return;
      }

      // Si les symboles ne sont pas encore chargés, les charger
      if (!symbolsLoaded) {
        try {
          const response = await fetch("/api/scryfall/symbology");
          if (response.ok) {
            const data = await response.json();
            // Mettre en cache tous les symboles
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.data.forEach((item: any) => {
              if (item.svg_uri) {
                symbolCache[item.symbol] = item.svg_uri;
              }
            });
            symbolsLoaded = true;

            // Maintenant récupérer l'URI pour ce symbole
            if (symbolCache[symbol]) {
              setSvgUri(symbolCache[symbol]);
            } else {
              setError(true);
            }
          }
        } catch (err) {
          console.error("Error loading symbols:", err);
          setError(true);
        }
      }
    };

    loadSymbols();
  }, [symbol]);

  if (error || (!svgUri && symbolsLoaded)) {
    return (
      <span
        className={cn("inline-block font-bold text-xs", className)}
        style={{ fontSize: size * 0.8 }}
      >
        {symbol}
      </span>
    );
  }

  if (!svgUri) {
    return null; // Chargement en cours
  }

  return (
    <img
      src={svgUri}
      alt={symbol}
      width={size}
      height={size}
      className={cn("inline-block", className)}
      style={{ verticalAlign: "middle" }}
      onError={() => setError(true)}
    />
  );
}

interface ManaSymbolsProps {
  manaCost: string;
  size?: number;
  className?: string;
}

/**
 * Composant pour afficher une série de symboles de mana
 * Exemple: "{2}{G}{G}" affichera trois symboles
 */
export function ManaSymbols({
  manaCost,
  size = 20,
  className = "",
}: ManaSymbolsProps) {
  if (!manaCost) return null;

  // Extraire tous les symboles entre accolades
  const symbols = manaCost.match(/\{[^}]+\}/g) || [];

  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {symbols.map((symbol, index) => (
        <ManaSymbol key={`${symbol}-${index}`} symbol={symbol} size={size} />
      ))}
    </span>
  );
}

interface ManaTextProps {
  text: string;
  symbolSize?: number;
  className?: string;
}

/**
 * Composant pour afficher du texte avec des symboles de mana intégrés
 * Remplace automatiquement les symboles {X} par leurs images
 */
export function ManaText({
  text,
  symbolSize = 16,
  className = "",
}: ManaTextProps) {
  if (!text) return null;

  // Diviser le texte en parties (texte normal et symboles)
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  const symbolRegex = /\{[^}]+\}/g;
  let match;

  while ((match = symbolRegex.exec(text)) !== null) {
    // Ajouter le texte avant le symbole
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Ajouter le symbole
    parts.push(
      <ManaSymbol
        key={`${match[0]}-${match.index}`}
        symbol={match[0]}
        size={symbolSize}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Ajouter le texte restant
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}
