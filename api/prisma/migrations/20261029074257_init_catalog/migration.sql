-- CreateTable
CREATE TABLE "CatalogImport" (
    "catalogVersion" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "sourceChecksum" TEXT NOT NULL,
    "exportChecksum" TEXT NOT NULL,
    "cleaningVersion" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "sourceTrackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artistsText" TEXT NOT NULL,
    "albumName" TEXT,
    "genre" TEXT NOT NULL,
    "popularity" INTEGER,
    "durationMs" INTEGER,
    "explicit" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "catalogVersion" TEXT NOT NULL,
    "searchTitle" TEXT NOT NULL,
    "searchArtists" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Track_catalogVersion_fkey" FOREIGN KEY ("catalogVersion") REFERENCES "CatalogImport" ("catalogVersion") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Track_status_searchTitle_id_idx" ON "Track"("status", "searchTitle", "id");

-- CreateIndex
CREATE INDEX "Track_catalogVersion_idx" ON "Track"("catalogVersion");

-- CreateIndex
CREATE UNIQUE INDEX "Track_source_sourceTrackId_key" ON "Track"("source", "sourceTrackId");
