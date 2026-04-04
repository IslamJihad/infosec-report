import { GoogleGenerativeAI } from '@google/generative-ai';
import { normalizeAIModel, type AIProvider } from '@/lib/ai/models';

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;
const RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

export interface ProviderMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ProviderChatInput {
  provider: AIProvider;
  apiKey: string;
  model: string;
  systemPrompt: string;
  history: ProviderMessage[];
  userMessage: string;
  maxOutputTokens?: number;
  temperature?: number;
}

export class ProviderRequestError extends Error {
  provider: AIProvider;
  statusCode?: number;
  retryable: boolean;

  constructor(
    provider: AIProvider,
    message: string,
    options?: { statusCode?: number; retryable?: boolean; cause?: unknown }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'ProviderRequestError';
    this.provider = provider;
    this.statusCode = options?.statusCode;
    this.retryable = options?.retryable ?? false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(provider: AIProvider, promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new ProviderRequestError(provider, 'Provider request timed out.', { retryable: true }));
    }, timeoutMs);

    promise
      .then((result) => resolve(result))
      .catch((error: unknown) => reject(error))
      .finally(() => clearTimeout(timer));
  });
}

function normalizeError(provider: AIProvider, error: unknown): ProviderRequestError {
  if (error instanceof ProviderRequestError) {
    return error;
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError' || /timeout|timed out/i.test(error.message)) {
      return new ProviderRequestError(provider, 'Provider request timed out.', { retryable: true, cause: error });
    }

    return new ProviderRequestError(provider, 'Provider request failed.', { retryable: false, cause: error });
  }

  return new ProviderRequestError(provider, 'Provider request failed.', { retryable: false, cause: error });
}

export async function generateProviderReply(input: ProviderChatInput): Promise<string> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      if (input.provider === 'nvidia') {
        return await generateWithNvidia(input);
      }

      return await generateWithGemini(input);
    } catch (error: unknown) {
      const normalized = normalizeError(input.provider, error);
      const canRetry = normalized.retryable && attempt < MAX_ATTEMPTS;

      if (!canRetry) {
        throw normalized;
      }

      await sleep(200 * 2 ** (attempt - 1));
    }
  }

  throw new ProviderRequestError(input.provider, 'Provider request failed.');
}

async function generateWithGemini(input: ProviderChatInput): Promise<string> {
  const modelName = normalizeAIModel('gemini', input.model);
  const genAI = new GoogleGenerativeAI(input.apiKey);

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: {
      role: 'user',
      parts: [{ text: input.systemPrompt }],
    },
    generationConfig: {
      maxOutputTokens: input.maxOutputTokens ?? 2000,
      temperature: input.temperature ?? 0.3,
    },
  });

  const geminiHistory = input.history.map((message) => ({
    role: (message.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
    parts: [{ text: message.content }],
  }));

  const chat = model.startChat({ history: geminiHistory });
  const response = await withTimeout('gemini', chat.sendMessage(input.userMessage), REQUEST_TIMEOUT_MS);
  return response.response.text()?.trim() || 'لا يوجد رد';
}

async function generateWithNvidia(input: ProviderChatInput): Promise<string> {
  const modelName = normalizeAIModel('nvidia', input.model);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: input.maxOutputTokens ?? 2000,
        temperature: input.temperature ?? 0.3,
        messages: [
          { role: 'system', content: input.systemPrompt },
          ...input.history.map((message) => ({ role: message.role, content: message.content })),
          { role: 'user', content: input.userMessage },
        ],
      }),
      signal: controller.signal,
    });
  } catch (error: unknown) {
    throw normalizeError('nvidia', error);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new ProviderRequestError('nvidia', `NVIDIA API ${response.status}`, {
      statusCode: response.status,
      retryable: RETRYABLE_STATUS_CODES.has(response.status),
      cause: errorText,
    });
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === 'string') {
    return content.trim() || 'لا يوجد رد';
  }

  if (Array.isArray(content)) {
    const text = content
      .filter((item) => item?.type === 'text' && typeof item.text === 'string')
      .map((item) => item.text)
      .join('\n')
      .trim();

    return text || 'لا يوجد رد';
  }

  return 'لا يوجد رد';
}
