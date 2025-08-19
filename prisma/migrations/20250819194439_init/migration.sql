-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "visible_password" TEXT,
    "role" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameLevel" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "maxScore" INTEGER NOT NULL,

    CONSTRAINT "GameLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Performance" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "levelId" INTEGER NOT NULL,
    "timestampId" INTEGER,
    "score" INTEGER NOT NULL,
    "cumulativeProfit" DECIMAL(65,30) NOT NULL,
    "cashFlow" DECIMAL(65,30) NOT NULL,
    "rawMaterialAStock" INTEGER NOT NULL,
    "rawMaterialBStock" INTEGER NOT NULL,
    "finishedGoodStock" INTEGER NOT NULL,
    "decisions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TimeStamp" (
    "id" SERIAL NOT NULL,
    "levelId" INTEGER NOT NULL,
    "timestampNumber" INTEGER NOT NULL,
    "marketDemand" INTEGER NOT NULL,
    "rawMaterialAPrice" DECIMAL(65,30) NOT NULL,
    "rawMaterialBPrice" DECIMAL(65,30) NOT NULL,
    "finishedGoodPrice" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "TimeStamp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- AddForeignKey
ALTER TABLE "public"."Performance" ADD CONSTRAINT "Performance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Performance" ADD CONSTRAINT "Performance_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "public"."GameLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Performance" ADD CONSTRAINT "Performance_timestampId_fkey" FOREIGN KEY ("timestampId") REFERENCES "public"."TimeStamp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeStamp" ADD CONSTRAINT "TimeStamp_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "public"."GameLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
