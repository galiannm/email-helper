ALTER TABLE "Director" ADD COLUMN "location" TEXT NOT NULL DEFAULT 'bangkok';
ALTER TABLE "Director" ADD COLUMN "section"  TEXT NOT NULL DEFAULT 'both';

UPDATE "Director" SET "location" = 'bangkok',   "section" = 'french'        WHERE "id" = 'SATHORN';
UPDATE "Director" SET "location" = 'bangkok',   "section" = 'international' WHERE "id" = 'SUKHUMVIT';
UPDATE "Director" SET "location" = 'hanoi',     "section" = 'both'          WHERE "id" = 'HANOI_TAYHO';
UPDATE "Director" SET "location" = 'hanoi',     "section" = 'both'          WHERE "id" = 'HANOI_LONGBIEN';
UPDATE "Director" SET "location" = 'phnomPenh', "section" = 'both'          WHERE "id" = 'PHNOM_PENH';
UPDATE "Director" SET "location" = 'bangkok',   "section" = 'both'          WHERE "id" = 'DEFAULT';
