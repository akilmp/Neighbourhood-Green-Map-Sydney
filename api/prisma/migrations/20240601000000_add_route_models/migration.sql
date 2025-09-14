CREATE TABLE "Route" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "distanceKm" DOUBLE PRECISION NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "path" geometry(LineString,4326) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Route" ADD CONSTRAINT "Route_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "RouteSpot" (
  "routeId" TEXT NOT NULL,
  "spotId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  CONSTRAINT "RouteSpot_pkey" PRIMARY KEY ("routeId", "spotId")
);

CREATE UNIQUE INDEX "RouteSpot_routeId_order_key" ON "RouteSpot"("routeId", "order");

ALTER TABLE "RouteSpot" ADD CONSTRAINT "RouteSpot_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RouteSpot" ADD CONSTRAINT "RouteSpot_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
