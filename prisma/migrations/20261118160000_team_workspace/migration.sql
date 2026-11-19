-- CreateTable
CREATE TABLE "TeamWorkspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "TeamWorkspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    CONSTRAINT "TeamInvitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "TeamWorkspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamSession" (
    "tokenHash" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "TeamSession_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeamMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamResume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "teamVisible" BOOLEAN NOT NULL DEFAULT true,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamResume_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "TeamMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "notes" TEXT NOT NULL DEFAULT '',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamApplication_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "TeamWorkspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamActivity_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "TeamWorkspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "TeamMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_handle_key" ON "TeamMember"("handle");

-- CreateIndex
CREATE INDEX "TeamMember_workspaceId_idx" ON "TeamMember"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_tokenHash_key" ON "TeamInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "TeamInvitation_workspaceId_idx" ON "TeamInvitation"("workspaceId");

-- CreateIndex
CREATE INDEX "TeamSession_memberId_expiresAt_idx" ON "TeamSession"("memberId", "expiresAt");

-- CreateIndex
CREATE INDEX "TeamResume_ownerId_idx" ON "TeamResume"("ownerId");

-- CreateIndex
CREATE INDEX "TeamApplication_workspaceId_deletedAt_updatedAt_idx" ON "TeamApplication"("workspaceId", "deletedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "TeamActivity_workspaceId_createdAt_id_idx" ON "TeamActivity"("workspaceId", "createdAt", "id");

