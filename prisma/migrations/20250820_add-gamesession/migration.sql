-- DropForeignKey
ALTER TABLE "public"."Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropIndex
DROP INDEX "public"."GameSession_levelId_idx";

-- DropIndex
DROP INDEX "public"."GameSession_userId_idx";

-- AlterTable
ALTER TABLE "public"."Session" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

