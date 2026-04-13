import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
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

let cachedEncryptionKey: Uint8Array | null | undefined;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function mergeByteArrays(first: Uint8Array, second: Uint8Array): Uint8Array {
  const merged = new Uint8Array(first.length + second.length);
  merged.set(first, 0);
  merged.set(second, first.length);
  return merged;
}

function getEncryptionKey(): Uint8Array | null {
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
  const encrypted = mergeByteArrays(new Uint8Array(cipher.update(value, 'utf8')), new Uint8Array(cipher.final()));
  const authTag = cipher.getAuthTag();
  const payload = `${bytesToBase64(new Uint8Array(iv))}.${bytesToBase64(new Uint8Array(authTag))}.${bytesToBase64(encrypted)}`;

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
    const [ivBase64, authTagBase64, ciphertextBase64] = encoded.split('.');
    if (!ivBase64 || !authTagBase64 || !ciphertextBase64) {
      return '';
    }

    const iv = base64ToBytes(ivBase64);
    const authTag = base64ToBytes(authTagBase64);
    const ciphertext = base64ToBytes(ciphertextBase64);

    const decipher = createDecipheriv('aes-256-gcm', encryptionKey, iv);
    decipher.setAuthTag(authTag);

    const plainFirst = new Uint8Array(decipher.update(ciphertext));
    const plainSecond = new Uint8Array(decipher.final());
    const plain = mergeByteArrays(plainFirst, plainSecond);

    return new TextDecoder().decode(plain);
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
