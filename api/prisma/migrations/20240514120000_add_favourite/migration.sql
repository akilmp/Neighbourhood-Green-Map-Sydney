-- CreateTable
CREATE TABLE "Favourite" (
    "userId" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favourite_pkey" PRIMARY KEY ("userId", "spotId"),
    CONSTRAINT "Favourite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Favourite_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
