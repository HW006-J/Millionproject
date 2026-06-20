-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'MOCK');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "targetAmountCents" INTEGER NOT NULL,
    "confirmedAmountCents" INTEGER NOT NULL DEFAULT 0,
    "confirmedContributionCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "paymentProvider" "PaymentProvider" NOT NULL,
    "providerSessionId" TEXT,
    "providerPaymentId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "publicName" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "emailHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");

-- CreateIndex
CREATE INDEX "Campaign_isActive_idx" ON "Campaign"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_providerSessionId_key" ON "Contribution"("providerSessionId");

-- CreateIndex
CREATE INDEX "Contribution_campaignId_idx" ON "Contribution"("campaignId");

-- CreateIndex
CREATE INDEX "Contribution_paymentStatus_idx" ON "Contribution"("paymentStatus");

-- CreateIndex
CREATE INDEX "Contribution_createdAt_idx" ON "Contribution"("createdAt");

-- CreateIndex
CREATE INDEX "Contribution_confirmedAt_idx" ON "Contribution"("confirmedAt");

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
