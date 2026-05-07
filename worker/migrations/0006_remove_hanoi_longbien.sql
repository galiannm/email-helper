-- Reassign any drafts pointing to the duplicate record before deleting it
UPDATE "EmailDraft" SET "directorCampusCode" = 'HANOI_TAYHO' WHERE "directorCampusCode" = 'HANOI_LONGBIEN';

-- Remove the duplicate — Amandine handles all Hanoi campuses via HANOI_TAYHO
DELETE FROM "Director" WHERE "id" = 'HANOI_LONGBIEN';
