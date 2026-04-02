import prisma from '@/lib/db';
import { ensureAppSettingsColumns } from '@/lib/db/ensureAppSettingsColumns';

export interface PersistedAppSettings {
  id: string;
  aiApiKey: string;
  aiProvider: string;
  geminiApiKey: string;
  nvidiaApiKey: string;
  aiModel: string;
  defaultOrgName: string;
  defaultAuthor: string;
}

const DEFAULT_SETTINGS: PersistedAppSettings = {
  id: 'singleton',
  aiApiKey: '',
  aiProvider: 'gemini',
  geminiApiKey: '',
  nvidiaApiKey: '',
  aiModel: 'gemini-2.5-flash',
  defaultOrgName: '',
  defaultAuthor: '',
};

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeRow(row?: Partial<PersistedAppSettings>): PersistedAppSettings {
  return {
    id: asString(row?.id, DEFAULT_SETTINGS.id),
    aiApiKey: asString(row?.aiApiKey, DEFAULT_SETTINGS.aiApiKey),
    aiProvider: asString(row?.aiProvider, DEFAULT_SETTINGS.aiProvider),
    geminiApiKey: asString(row?.geminiApiKey, DEFAULT_SETTINGS.geminiApiKey),
    nvidiaApiKey: asString(row?.nvidiaApiKey, DEFAULT_SETTINGS.nvidiaApiKey),
    aiModel: asString(row?.aiModel, DEFAULT_SETTINGS.aiModel),
    defaultOrgName: asString(row?.defaultOrgName, DEFAULT_SETTINGS.defaultOrgName),
    defaultAuthor: asString(row?.defaultAuthor, DEFAULT_SETTINGS.defaultAuthor),
  };
}

async function ensureSingletonRow() {
  await prisma.$executeRaw`
    INSERT INTO "AppSettings"
      ("id", "aiApiKey", "aiModel", "defaultOrgName", "defaultAuthor", "aiProvider", "geminiApiKey", "nvidiaApiKey")
    VALUES
      ('singleton', '', 'gemini-2.5-flash', '', '', 'gemini', '', '')
    ON CONFLICT("id") DO NOTHING
  `;
}

export async function getPersistedAppSettings(): Promise<PersistedAppSettings> {
  await ensureAppSettingsColumns();
  await ensureSingletonRow();

  const rows = await prisma.$queryRaw<Array<Partial<PersistedAppSettings>>>`
    SELECT
      "id",
      "aiApiKey",
      "aiProvider",
      "geminiApiKey",
      "nvidiaApiKey",
      "aiModel",
      "defaultOrgName",
      "defaultAuthor"
    FROM "AppSettings"
    WHERE "id" = 'singleton'
    LIMIT 1
  `;

  return normalizeRow(rows[0]);
}

export async function upsertPersistedAppSettings(
  settings: Omit<PersistedAppSettings, 'id'>
): Promise<PersistedAppSettings> {
  await ensureAppSettingsColumns();

  await prisma.$executeRaw`
    INSERT INTO "AppSettings"
      ("id", "aiApiKey", "aiProvider", "geminiApiKey", "nvidiaApiKey", "aiModel", "defaultOrgName", "defaultAuthor")
    VALUES
      ('singleton', ${settings.aiApiKey}, ${settings.aiProvider}, ${settings.geminiApiKey}, ${settings.nvidiaApiKey}, ${settings.aiModel}, ${settings.defaultOrgName}, ${settings.defaultAuthor})
    ON CONFLICT("id") DO UPDATE SET
      "aiApiKey" = excluded."aiApiKey",
      "aiProvider" = excluded."aiProvider",
      "geminiApiKey" = excluded."geminiApiKey",
      "nvidiaApiKey" = excluded."nvidiaApiKey",
      "aiModel" = excluded."aiModel",
      "defaultOrgName" = excluded."defaultOrgName",
      "defaultAuthor" = excluded."defaultAuthor"
  `;

  return getPersistedAppSettings();
}
