-- Simplify DeckCard model by removing isMainboard and category fields
-- Drop the existing unique constraint that includes isMainboard
DROP INDEX IF EXISTS "DeckCard_deckId_cardId_isMainboard_key";

-- Remove the category column
ALTER TABLE "DeckCard"
DROP COLUMN IF EXISTS "category";

-- Remove the isMainboard column
ALTER TABLE "DeckCard"
DROP COLUMN IF EXISTS "isMainboard";

-- Add the new unique constraint on deckId and cardId only
CREATE UNIQUE INDEX "DeckCard_deckId_cardId_key" ON "DeckCard" ("deckId", "cardId");