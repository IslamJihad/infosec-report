import { NextResponse } from 'next/server';
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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TestConnectionBody;
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
