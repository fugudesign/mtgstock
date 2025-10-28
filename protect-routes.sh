#!/bin/bash

# Liste des fichiers à protéger
files=(
  "src/app/profile/page.tsx"
  "src/app/cards/[id]/page.tsx"
  "src/app/collections/[id]/page.tsx"
  "src/app/decks/[id]/page.tsx"
)

for file in "${files[@]}"; do
  echo "Processing $file..."
  
  # Ajouter l'import ProtectedRoute si pas déjà présent
  if ! grep -q "ProtectedRoute" "$file"; then
    # Trouver la ligne avec les imports et ajouter après la première ligne "use client"
    sed -i '' '/"use client";/a\
\
import { ProtectedRoute } from "@/components/ProtectedRoute";
' "$file"
  fi
  
  echo "Done with $file"
done

echo "All files processed!"
