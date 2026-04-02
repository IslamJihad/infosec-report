import { GoogleGenerativeAI } from '@google/generative-ai';
import { normalizeAIModel, type AIProvider } from '@/lib/ai/models';

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

export async function generateProviderReply(input: ProviderChatInput): Promise<string> {
  if (input.provider === 'nvidia') {
    return generateWithNvidia(input);
  }
  return generateWithGemini(input);
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
  const response = await chat.sendMessage(input.userMessage);
  return response.response.text()?.trim() || 'لا يوجد رد';
}

async function generateWithNvidia(input: ProviderChatInput): Promise<string> {
  const modelName = normalizeAIModel('nvidia', input.model);
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
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
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API ${response.status}: ${errorText.slice(0, 250)}`);
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
