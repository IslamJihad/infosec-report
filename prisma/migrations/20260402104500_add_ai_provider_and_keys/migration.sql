-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN "aiProvider" TEXT NOT NULL DEFAULT 'gemini';
ALTER TABLE "AppSettings" ADD COLUMN "geminiApiKey" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AppSettings" ADD COLUMN "nvidiaApiKey" TEXT NOT NULL DEFAULT '';

-- Backfill legacy key into Gemini key for existing deployments
UPDATE "AppSettings"
SET "geminiApiKey" = COALESCE(NULLIF("geminiApiKey", ''), COALESCE("aiApiKey", ''));

UPDATE "AppSettings"
SET "aiProvider" = 'gemini'
WHERE "aiProvider" IS NULL OR "aiProvider" = '';
