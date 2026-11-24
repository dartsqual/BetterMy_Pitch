-- AlterTable
ALTER TABLE "Message" ADD COLUMN "speaker" TEXT;

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "memberId" TEXT NOT NULL,
    "messageId" TEXT,
    "action" TEXT NOT NULL,
    "addressedTo" TEXT NOT NULL,
    "interest" INTEGER NOT NULL,
    "trust" INTEGER NOT NULL,
    "reasoning" TEXT NOT NULL,
    CONSTRAINT "Decision_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "title" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "personaName" TEXT NOT NULL,
    "personaBrief" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "customFlow" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "members" TEXT NOT NULL DEFAULT '[]'
);
INSERT INTO "new_Session" ("createdAt", "customFlow", "difficulty", "endedAt", "framework", "id", "language", "personaBrief", "personaId", "personaName", "product", "status", "title") SELECT "createdAt", "customFlow", "difficulty", "endedAt", "framework", "id", "language", "personaBrief", "personaId", "personaName", "product", "status", "title" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Decision_sessionId_createdAt_idx" ON "Decision"("sessionId", "createdAt");
