import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getProviderMeta, normalizeAIModel, normalizeAIProvider } from '@/lib/ai/models';
import { generateProviderReply } from '@/lib/ai/providers';
import { getPersistedAppSettings } from '@/lib/db/appSettings';

interface TestConnectionBody {
  aiProvider?: string;
  aiModel?: string;
  geminiApiKey?: string;
  nvidiaApiKey?: string;
  aiApiKey?: string;
}

const TestConnectionBodySchema = z.object({
  aiProvider: z.string().max(32).optional(),
  aiModel: z.string().max(128).optional(),
  geminiApiKey: z.string().max(1024).optional(),
  nvidiaApiKey: z.string().max(1024).optional(),
  aiApiKey: z.string().max(1024).optional(),
}).strict();

export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json({ ok: false, error: 'بيانات الطلب غير صالحة.' }, { status: 400 });
    }

    const parsedBody = TestConnectionBodySchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ ok: false, error: 'تعذر التحقق من بيانات الطلب.' }, { status: 400 });
    }

    const body = parsedBody.data as TestConnectionBody;
    const aiProvider = normalizeAIProvider(body.aiProvider);
    const aiModel = normalizeAIModel(aiProvider, body.aiModel);
    let apiKey = aiProvider === 'nvidia'
      ? (body.nvidiaApiKey || '')
      : (body.geminiApiKey || body.aiApiKey || '');

    if (!apiKey) {
      const settings = await getPersistedAppSettings();
      apiKey = aiProvider === 'nvidia'
        ? (settings.nvidiaApiKey || '')
        : (settings.geminiApiKey || settings.aiApiKey || '');
    }

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: `يرجى إدخال مفتاح API لمزود ${getProviderMeta(aiProvider).label}` },
        { status: 400 }
      );
    }

    await generateProviderReply({
      provider: aiProvider,
      apiKey,
      model: aiModel,
      systemPrompt: 'أنت مساعد تقني مختصر.',
      history: [],
      userMessage: 'أجب بكلمة واحدة: تجربة',
      maxOutputTokens: 32,
      temperature: 0.2,
    });

    return NextResponse.json({
      ok: true,
      message: `الاتصال ناجح! ${getProviderMeta(aiProvider).label} يعمل بشكل صحيح.`,
    });
  } catch (error: unknown) {
    console.error('AI connection test failed:', error);
    return NextResponse.json(
      { ok: false, error: 'فشل اختبار الاتصال بمزود الذكاء الاصطناعي. تحقق من المفتاح أو حاول لاحقاً.' },
      { status: 500 }
    );
  }
}
