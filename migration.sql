-- This is an auto-generated migration file based on the changes in schema.prisma.
-- Please review it carefully before running it on your database.
-- It is recommended to use `prisma migrate dev` to generate and apply migrations automatically.

/*
  Warnings:

  - The data types for several columns have been changed to use ENUMs. This could fail if existing data cannot be cast to the new types.
  - The data type for `UserProfile.dateOfBirth` has been changed from TEXT to TIMESTAMP. This could fail if the existing string is not a valid timestamp format.
  - Foreign key constraints for `UserProfile` and `RiskProfile` are being updated to add `ON DELETE CASCADE`.

*/

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin', 'premium');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL', 'DIVIDEND');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::text::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'user';

-- AlterTable
ALTER TABLE "UserProfile" DROP CONSTRAINT "UserProfile_userId_fkey";
ALTER TABLE "UserProfile" ALTER COLUMN "dateOfBirth" TYPE TIMESTAMP(3) USING "dateOfBirth"::timestamp;
ALTER TABLE "UserProfile" ALTER COLUMN "riskTolerance" TYPE "RiskLevel" USING "riskTolerance"::text::"RiskLevel";
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType" USING "type"::text::"TransactionType";

-- AlterTable
ALTER TABLE "RiskProfile" DROP CONSTRAINT "RiskProfile_userId_fkey";
ALTER TABLE "RiskProfile" ALTER COLUMN "riskTolerance" TYPE "RiskLevel" USING "riskTolerance"::text::"RiskLevel";
ALTER TABLE "RiskProfile" ADD CONSTRAINT "RiskProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "UserChallenge_userId_challengeId_key" ON "UserChallenge"("userId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "Portfolio_userId_idx" ON "Portfolio"("userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_portfolioId_idx" ON "Transaction"("portfolioId");

-- CreateIndex
CREATE INDEX "RiskProfile_userId_idx" ON "RiskProfile"("userId");

-- CreateIndex
CREATE INDEX "LearningPath_userId_idx" ON "LearningPath"("userId");

-- CreateIndex
CREATE INDEX "NudgeLog_userId_idx" ON "NudgeLog"("userId");