-- AlterTable
ALTER TABLE "CollectionCard" ADD COLUMN     "lastPrice" DOUBLE PRECISION,
ADD COLUMN     "lastPriceCheck" TIMESTAMP(3),
ADD COLUMN     "lastPriceCurrency" TEXT DEFAULT 'EUR';

-- AlterTable
ALTER TABLE "DeckCard" ADD COLUMN     "lastPrice" DOUBLE PRECISION,
ADD COLUMN     "lastPriceCheck" TIMESTAMP(3),
ADD COLUMN     "lastPriceCurrency" TEXT DEFAULT 'EUR';

-- CreateTable
CREATE TABLE "CardPriceHistory" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "priceFoil" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CardPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardPriceHistory_userId_cardId_idx" ON "CardPriceHistory"("userId", "cardId");

-- CreateIndex
CREATE INDEX "CardPriceHistory_checkedAt_idx" ON "CardPriceHistory"("checkedAt");

-- CreateIndex
CREATE INDEX "CardPriceHistory_cardId_idx" ON "CardPriceHistory"("cardId");

-- AddForeignKey
ALTER TABLE "CardPriceHistory" ADD CONSTRAINT "CardPriceHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
