import { NextResponse } from 'next/server';
import { getProviderMeta, normalizeAIModel, normalizeAIProvider } from '@/lib/ai/models';
import { generateProviderReply } from '@/lib/ai/providers';

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
    const apiKey = aiProvider === 'nvidia'
      ? (body.nvidiaApiKey || '')
      : (body.geminiApiKey || body.aiApiKey || '');

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
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: `فشل اختبار الاتصال: ${errMsg.slice(0, 220)}` },
      { status: 500 }
    );
  }
}
