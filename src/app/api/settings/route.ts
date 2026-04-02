import { NextResponse } from 'next/server';
import {
  getDefaultModelForProvider,
  normalizeAIModel,
  normalizeAIProvider,
} from '@/lib/ai/models';
import {
  getPersistedAppSettings,
  upsertPersistedAppSettings,
  type PersistedAppSettings,
} from '@/lib/db/appSettings';

type SettingsBody = {
  aiApiKey?: string;
  aiProvider?: string;
  geminiApiKey?: string;
  nvidiaApiKey?: string;
  aiModel?: string;
  defaultOrgName?: string;
  defaultAuthor?: string;
};

function normalizeOutgoingSettings(settings: PersistedAppSettings) {
  const aiProvider = normalizeAIProvider(settings.aiProvider);
  const geminiApiKey = settings.geminiApiKey || settings.aiApiKey || '';
  const aiModel = normalizeAIModel(aiProvider, settings.aiModel);

  return {
    id: settings.id,
    aiProvider,
    aiModel,
    aiApiKey: geminiApiKey,
    geminiApiKey,
    nvidiaApiKey: settings.nvidiaApiKey || '',
    defaultOrgName: settings.defaultOrgName || '',
    defaultAuthor: settings.defaultAuthor || '',
  };
}

function hasOwnField<T extends object>(obj: T, key: keyof T): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export async function GET() {
  try {
    const settings = await getPersistedAppSettings();

    const normalized = normalizeOutgoingSettings(settings);
    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as SettingsBody;
    const current = await getPersistedAppSettings();

    const currentProvider = normalizeAIProvider(current?.aiProvider);
    const requestedProvider = hasOwnField(body, 'aiProvider')
      ? normalizeAIProvider(body.aiProvider)
      : currentProvider;

    const currentGeminiKey = current?.geminiApiKey || current?.aiApiKey || '';
    const geminiApiKey = hasOwnField(body, 'geminiApiKey')
      ? (body.geminiApiKey ?? '')
      : hasOwnField(body, 'aiApiKey')
        ? (body.aiApiKey ?? '')
        : currentGeminiKey;

    const nvidiaApiKey = hasOwnField(body, 'nvidiaApiKey')
      ? (body.nvidiaApiKey ?? '')
      : (current?.nvidiaApiKey || '');

    const aiModel = hasOwnField(body, 'aiModel')
      ? normalizeAIModel(requestedProvider, body.aiModel)
      : normalizeAIModel(requestedProvider, current?.aiModel || getDefaultModelForProvider(requestedProvider));

    const updatePayload = {
      aiProvider: requestedProvider,
      aiModel,
      aiApiKey: geminiApiKey,
      geminiApiKey,
      nvidiaApiKey,
      defaultOrgName: hasOwnField(body, 'defaultOrgName')
        ? (body.defaultOrgName ?? '')
        : (current?.defaultOrgName || ''),
      defaultAuthor: hasOwnField(body, 'defaultAuthor')
        ? (body.defaultAuthor ?? '')
        : (current?.defaultAuthor || ''),
    };

    const settings = await upsertPersistedAppSettings(updatePayload);

    return NextResponse.json(normalizeOutgoingSettings(settings));
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}
