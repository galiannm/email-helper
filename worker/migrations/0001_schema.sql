-- Better Auth tables
CREATE TABLE "user" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "emailVerified" INTEGER NOT NULL DEFAULT 0,
  "image" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

CREATE TABLE "session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "expiresAt" DATETIME NOT NULL,
  "token" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL,
  CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

CREATE TABLE "account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" DATETIME,
  "refreshTokenExpiresAt" DATETIME,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "verification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Access control
CREATE TABLE "AllowedEmail" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'normal',
  "addedBy" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "AllowedEmail_email_key" ON "AllowedEmail"("email");

-- Config tables
CREATE TABLE "Director" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "schoolName" TEXT NOT NULL,
  "signatureEn" TEXT,
  "signatureFr" TEXT,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Section" (
  "code" TEXT NOT NULL PRIMARY KEY,
  "nameEn" TEXT NOT NULL,
  "ageRangeEn" TEXT NOT NULL,
  "nameFr" TEXT NOT NULL,
  "ageRangeFr" TEXT NOT NULL,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Template" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "campus" TEXT NOT NULL,
  "part" TEXT NOT NULL,
  "textEn" TEXT NOT NULL,
  "textFr" TEXT NOT NULL,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Template_campus_part_key" ON "Template"("campus", "part");

CREATE TABLE "Document" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "campus" TEXT,
  "fileKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uploadedBy" TEXT NOT NULL
);

-- Email pipeline
CREATE TABLE "IncomingEmail" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fromAddress" TEXT NOT NULL,
  "toAddress" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "rawText" TEXT NOT NULL,
  "rawEmailKey" TEXT,
  "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'new',
  "errorMessage" TEXT
);
CREATE INDEX "IncomingEmail_status_idx" ON "IncomingEmail"("status");
CREATE INDEX "IncomingEmail_receivedAt_idx" ON "IncomingEmail"("receivedAt");

CREATE TABLE "ExtractedInfo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "emailId" TEXT NOT NULL,
  "parentName" TEXT,
  "childName" TEXT,
  "childAge" TEXT,
  "detectedLanguage" TEXT,
  "detectedCampus" TEXT,
  "sectionCode" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExtractedInfo_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "IncomingEmail" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ExtractedInfo_emailId_key" ON "ExtractedInfo"("emailId");

CREATE TABLE "EmailDraft" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "emailId" TEXT NOT NULL,
  "directorCampusCode" TEXT NOT NULL,
  "draftText" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "editedAt" DATETIME,
  "sentAt" DATETIME,
  CONSTRAINT "EmailDraft_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "IncomingEmail" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EmailDraft_directorCampusCode_fkey" FOREIGN KEY ("directorCampusCode") REFERENCES "Director" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EmailDraft_emailId_key" ON "EmailDraft"("emailId");
