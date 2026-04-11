import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import prisma from '@/lib/db';
import { ensureAppSettingsColumns } from '@/lib/db/ensureAppSettingsColumns';
import { normalizeThemeMode, type ThemeMode } from '@/lib/theme';

export interface PersistedAppSettings {
  id: string;
  aiApiKey: string;
  aiProvider: string;
  geminiApiKey: string;
  nvidiaApiKey: string;
  aiModel: string;
  theme: ThemeMode;
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
  theme: 'system',
  defaultOrgName: '',
  defaultAuthor: '',
};

const ENCRYPTION_PREFIX = 'enc:v1:';
const ENCRYPTION_SALT = 'infosec-report-app-settings';

let cachedEncryptionKey: Buffer | null | undefined;

function getEncryptionKey(): Buffer | null {
  if (cachedEncryptionKey !== undefined) {
    return cachedEncryptionKey;
  }

  const secret = process.env.APP_SETTINGS_ENC_KEY?.trim() || '';
  if (!secret) {
    cachedEncryptionKey = null;
    return cachedEncryptionKey;
  }

  cachedEncryptionKey = scryptSync(secret, ENCRYPTION_SALT, 32);
  return cachedEncryptionKey;
}

function encryptSecretIfEnabled(value: string): string {
  const encryptionKey = getEncryptionKey();
  if (!encryptionKey || !value.trim() || value.startsWith(ENCRYPTION_PREFIX)) {
    return value;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, encrypted]).toString('base64');

  return `${ENCRYPTION_PREFIX}${payload}`;
}

function decryptSecretIfNeeded(value: string): string {
  if (!value.startsWith(ENCRYPTION_PREFIX)) {
    return value;
  }

  const encryptionKey = getEncryptionKey();
  if (!encryptionKey) {
    return '';
  }

  try {
    const encoded = value.slice(ENCRYPTION_PREFIX.length);
    const payload = Buffer.from(encoded, 'base64');
    if (payload.length <= 28) {
      return '';
    }

    const iv = payload.subarray(0, 12);
    const authTag = payload.subarray(12, 28);
    const ciphertext = payload.subarray(28);

    const decipher = createDecipheriv('aes-256-gcm', encryptionKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeRow(row?: Partial<PersistedAppSettings>): PersistedAppSettings {
  return {
    id: asString(row?.id, DEFAULT_SETTINGS.id),
    aiApiKey: decryptSecretIfNeeded(asString(row?.aiApiKey, DEFAULT_SETTINGS.aiApiKey)),
    aiProvider: asString(row?.aiProvider, DEFAULT_SETTINGS.aiProvider),
    geminiApiKey: decryptSecretIfNeeded(asString(row?.geminiApiKey, DEFAULT_SETTINGS.geminiApiKey)),
    nvidiaApiKey: decryptSecretIfNeeded(asString(row?.nvidiaApiKey, DEFAULT_SETTINGS.nvidiaApiKey)),
    aiModel: asString(row?.aiModel, DEFAULT_SETTINGS.aiModel),
    theme: normalizeThemeMode(row?.theme),
    defaultOrgName: asString(row?.defaultOrgName, DEFAULT_SETTINGS.defaultOrgName),
    defaultAuthor: asString(row?.defaultAuthor, DEFAULT_SETTINGS.defaultAuthor),
  };
}

async function ensureSingletonRow() {
  await prisma.$executeRaw`
    INSERT INTO "AppSettings"
      ("id", "aiApiKey", "aiModel", "theme", "defaultOrgName", "defaultAuthor", "aiProvider", "geminiApiKey", "nvidiaApiKey")
    VALUES
      ('singleton', '', 'gemini-2.5-flash', 'system', '', '', 'gemini', '', '')
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
      "theme",
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

  const encryptedAiApiKey = encryptSecretIfEnabled(settings.aiApiKey);
  const encryptedGeminiApiKey = encryptSecretIfEnabled(settings.geminiApiKey);
  const encryptedNvidiaApiKey = encryptSecretIfEnabled(settings.nvidiaApiKey);

  await prisma.$executeRaw`
    INSERT INTO "AppSettings"
      ("id", "aiApiKey", "aiProvider", "geminiApiKey", "nvidiaApiKey", "aiModel", "theme", "defaultOrgName", "defaultAuthor")
    VALUES
      ('singleton', ${encryptedAiApiKey}, ${settings.aiProvider}, ${encryptedGeminiApiKey}, ${encryptedNvidiaApiKey}, ${settings.aiModel}, ${settings.theme}, ${settings.defaultOrgName}, ${settings.defaultAuthor})
    ON CONFLICT("id") DO UPDATE SET
      "aiApiKey" = excluded."aiApiKey",
      "aiProvider" = excluded."aiProvider",
      "geminiApiKey" = excluded."geminiApiKey",
      "nvidiaApiKey" = excluded."nvidiaApiKey",
      "aiModel" = excluded."aiModel",
      "theme" = excluded."theme",
      "defaultOrgName" = excluded."defaultOrgName",
      "defaultAuthor" = excluded."defaultAuthor"
  `;

  return getPersistedAppSettings();
}
