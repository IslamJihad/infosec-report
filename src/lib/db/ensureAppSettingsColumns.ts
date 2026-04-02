import prisma from '@/lib/db';

type TableInfoRow = {
  name: string;
};

let ensurePromise: Promise<void> | null = null;

async function runEnsure() {
  const columns = await prisma.$queryRawUnsafe<TableInfoRow[]>('PRAGMA table_info("AppSettings")');
  const names = new Set(columns.map((column) => String(column.name)));

  if (!names.has('aiProvider')) {
    await prisma.$executeRawUnsafe('ALTER TABLE "AppSettings" ADD COLUMN "aiProvider" TEXT NOT NULL DEFAULT \'gemini\'');
  }

  if (!names.has('geminiApiKey')) {
    await prisma.$executeRawUnsafe('ALTER TABLE "AppSettings" ADD COLUMN "geminiApiKey" TEXT NOT NULL DEFAULT \'\'');
  }

  if (!names.has('nvidiaApiKey')) {
    await prisma.$executeRawUnsafe('ALTER TABLE "AppSettings" ADD COLUMN "nvidiaApiKey" TEXT NOT NULL DEFAULT \'\'');
  }

  await prisma.$executeRawUnsafe(
    'UPDATE "AppSettings" SET "geminiApiKey" = COALESCE(NULLIF("geminiApiKey", \'\'), COALESCE("aiApiKey", \'\'))'
  );

  await prisma.$executeRawUnsafe(
    'UPDATE "AppSettings" SET "aiProvider" = \'gemini\' WHERE "aiProvider" IS NULL OR "aiProvider" = \'\''
  );
}

export async function ensureAppSettingsColumns() {
  if (!ensurePromise) {
    ensurePromise = runEnsure().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  await ensurePromise;
}
