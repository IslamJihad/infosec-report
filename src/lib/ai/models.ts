export type AIProvider = 'gemini' | 'nvidia';

export interface AIModelOption {
  value: string;
  label: string;
}

export interface AIProviderMeta {
  label: string;
  keyLabel: string;
  keyPlaceholder: string;
  keyHelpUrl: string;
  keyHelpText: string;
}

export const AI_PROVIDER_OPTIONS: Array<{ value: AIProvider; label: string }> = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'nvidia', label: 'NVIDIA NIM' },
];

export const AI_PROVIDER_META: Record<AIProvider, AIProviderMeta> = {
  gemini: {
    label: 'Google Gemini',
    keyLabel: 'مفتاح API - Google Gemini',
    keyPlaceholder: 'AIza...',
    keyHelpUrl: 'https://aistudio.google.com/apikey',
    keyHelpText: 'Google AI Studio',
  },
  nvidia: {
    label: 'NVIDIA NIM',
    keyLabel: 'مفتاح API - NVIDIA',
    keyPlaceholder: 'nvapi-...',
    keyHelpUrl: 'https://build.nvidia.com/settings/api-keys',
    keyHelpText: 'NVIDIA API Catalog',
  },
};

export const AI_MODEL_OPTIONS: Record<AIProvider, AIModelOption[]> = {
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (5 RPM - متقدم)' },
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (10 RPM - أسرع)' },
    { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (الأحدث)' },
  ],
  nvidia: [
    { value: 'meta/llama-3.1-70b-instruct', label: 'Meta Llama 3.1 70B Instruct (موصى به)' },
    { value: 'nvidia/llama3-chatqa-1.5-8b', label: 'NVIDIA Llama3 ChatQA 1.5 8B (أسرع)' },
    { value: 'meta/llama-3.3-70b-instruct', label: 'Meta Llama 3.3 70B Instruct (حديث)' },
  ],
};

export function normalizeAIProvider(value: string | null | undefined): AIProvider {
  return value === 'nvidia' ? 'nvidia' : 'gemini';
}

export function getDefaultModelForProvider(provider: AIProvider): string {
  return AI_MODEL_OPTIONS[provider][0].value;
}

export function isSupportedModel(provider: AIProvider, model: string | null | undefined): boolean {
  if (!model) return false;
  return AI_MODEL_OPTIONS[provider].some((option) => option.value === model);
}

export function normalizeAIModel(provider: AIProvider, model: string | null | undefined): string {
  return isSupportedModel(provider, model) ? (model as string) : getDefaultModelForProvider(provider);
}

export function getProviderMeta(provider: AIProvider): AIProviderMeta {
  return AI_PROVIDER_META[provider];
}
