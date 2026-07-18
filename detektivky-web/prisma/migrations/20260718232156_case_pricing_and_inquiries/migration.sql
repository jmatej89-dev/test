-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "priceCzk" INTEGER,
ADD COLUMN     "teaser" TEXT;

-- CreateTable
CREATE TABLE "OrderInquiry" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderInquiry_caseId_idx" ON "OrderInquiry"("caseId");

-- CreateIndex
CREATE INDEX "OrderInquiry_status_createdAt_idx" ON "OrderInquiry"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "OrderInquiry" ADD CONSTRAINT "OrderInquiry_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
