import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getProviderMeta, normalizeAIModel, normalizeAIProvider } from '@/lib/ai/models';
import { generateProviderReply, type ProviderMessage } from '@/lib/ai/providers';
import { getPersistedAppSettings } from '@/lib/db/appSettings';

const SYSTEM_PROMPT = 'أنت خبير أمن معلومات محترف. ردودك دقيقة ومبنية على البيانات المقدمة. تستخدم تنسيق Markdown باللغة العربية. تقدم تحليلات قابلة للتنفيذ.';
const REVIEW_TYPES = ['full', 'exec', 'board', 'risk', 'gaps'] as const;
type ReviewType = typeof REVIEW_TYPES[number];

type AIReviewBody = {
  reportId?: string;
  reviewType?: string;
  reportData?: unknown;
  followUp?: boolean;
  question?: string;
  history?: unknown;
  conversationId?: string;
};

function resolveReviewType(value: unknown): ReviewType {
  return typeof value === 'string' && (REVIEW_TYPES as readonly string[]).includes(value)
    ? (value as ReviewType)
    : 'full';
}

function toProviderHistory(history: unknown): ProviderMessage[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter((message): message is { role: string; content: string } => {
      if (!message || typeof message !== 'object') return false;
      const candidate = message as { role?: unknown; content?: unknown };
      return typeof candidate.role === 'string' && typeof candidate.content === 'string';
    })
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role as 'user' | 'assistant',
      content: message.content,
    }));
}

function buildInitialPrompt(reviewType: ReviewType, reportData: unknown): string {
  const dataStr = JSON.stringify(reportData ?? {}, null, 2);
  const prompts: Record<ReviewType, string> = {
    full: `أنت CISO خبير (كبير مسؤولي أمن المعلومات). راجع بيانات تقرير أمن المعلومات التالي وقدّم مراجعة شاملة باللغة العربية. كن دقيقاً ومبنياً على البيانات:\n\n${dataStr}\n\n## 🏆 نقاط القوة\n## ⚠️ نقاط الضعف\n## 🚨 تنبيهات عاجلة\n## 💡 توصيات إضافية\n## 📊 التقييم الشامل`,
    exec: `أنت مدير عام تتلقى هذا التقرير الأمني. قدّم رأيك بالعربية بصفتك متلقي التقرير:\n\n${dataStr}\n\n## 👔 ما الذي يهمني كمدير عام\n## ❓ الأسئلة التي سأطرحها\n## 📌 ما يقلقني أكثر\n## ✅ القرارات التي سأتخذها`,
    board: `أنت عضو مجلس إدارة غير تقني تتلقى هذا التقرير الأمني. قدّم تحليلك بالعربية بصفتك عضو مجلس إدارة يهتم بالأثر المالي واستمرارية الأعمال:\n\n${dataStr}\n\n## 🏛️ الملخص لمجلس الإدارة — ماذا يعني هذا للأعمال؟\n## 💰 الأثر المالي والمخاطر التشغيلية\n## 📊 هل الاستثمار الأمني كافٍ ومُجدٍ؟\n## ⚖️ المسؤولية القانونية والامتثال\n## 🎯 القرارات المطلوبة من المجلس`,
    risk: `أنت خبير إدارة مخاطر أمن المعلومات. حلّل المخاطر التالية بعمق باللغة العربية:\n\n${dataStr}\n\n## 🎯 تقييم دقة التصنيف\n## 🔴 المخاطر الأعلى أولوية\n## 🕳️ مخاطر غير مذكورة محتملة\n## 📐 توصيات لتحسين إدارة المخاطر`,
    gaps: `أنت مدقق أمن معلومات. ابحث عن النقاط المفقودة والفجوات في التقرير التالي باللغة العربية:\n\n${dataStr}\n\n## 🕳️ المعلومات الناقصة\n## 📋 أقسام يجب إضافتها\n## 🌐 مخاطر خارجية غير مذكورة\n## ✅ قائمة تحقق لتقرير مكتمل`,
  };

  return prompts[reviewType];
}

function safeParseMessages(raw: string): ProviderMessage[] {
  try {
    return toProviderHistory(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AIReviewBody;
    const reportId = typeof body.reportId === 'string' ? body.reportId : '';
    const reviewType = resolveReviewType(body.reviewType);
    const followUp = body.followUp === true;
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    const inputConversationId = typeof body.conversationId === 'string' ? body.conversationId : '';

    if (!reportId) {
      return NextResponse.json({ error: 'معرّف التقرير مطلوب.' }, { status: 400 });
    }

    if (followUp && !question) {
      return NextResponse.json({ error: 'يرجى إدخال سؤال المتابعة.' }, { status: 400 });
    }

    // Get API key from settings
    const settings = await getPersistedAppSettings();
    const provider = normalizeAIProvider(settings.aiProvider);
    const providerMeta = getProviderMeta(provider);
    const modelName = normalizeAIModel(provider, settings.aiModel);
    const apiKey = provider === 'nvidia'
      ? (settings.nvidiaApiKey || '')
      : (settings.geminiApiKey || settings.aiApiKey || '');

    if (!apiKey) {
      return NextResponse.json(
        { error: `مفتاح API غير مُعدّ لمزود ${providerMeta.label}. يرجى إضافته من صفحة الإعدادات.` },
        { status: 400 }
      );
    }

    let providerHistory: ProviderMessage[] = [];
    let userMessage: string;
    let conversationId: string | null = null;

    if (followUp) {
      providerHistory = toProviderHistory(body.history);

      if (!providerHistory.length && inputConversationId) {
        const existingConversation = await prisma.aIConversation.findUnique({ where: { id: inputConversationId } });
        if (existingConversation?.reportId === reportId) {
          providerHistory = safeParseMessages(existingConversation.messages);
          conversationId = existingConversation.id;
        }
      }

      userMessage = question;
    } else {
      userMessage = buildInitialPrompt(reviewType, body.reportData);
    }

    const assistantMessage = await generateProviderReply({
      provider,
      apiKey,
      model: modelName,
      systemPrompt: SYSTEM_PROMPT,
      history: providerHistory,
      userMessage,
      maxOutputTokens: 2000,
      temperature: 0.3,
    });

    const newUserMessage: ProviderMessage = followUp
      ? { role: 'user', content: question }
      : { role: 'user', content: `مراجعة: ${reviewType}` };

    const allMessages: ProviderMessage[] = [
      ...providerHistory,
      newUserMessage,
      { role: 'assistant', content: assistantMessage },
    ];

    try {
      if (followUp && inputConversationId) {
        const existingConversation = await prisma.aIConversation.findUnique({ where: { id: inputConversationId } });

        if (existingConversation?.reportId === reportId) {
          await prisma.aIConversation.update({
            where: { id: existingConversation.id },
            data: { messages: JSON.stringify(allMessages) },
          });
          conversationId = existingConversation.id;
        } else {
          const createdConversation = await prisma.aIConversation.create({
            data: {
              reportId,
              reviewType: reviewType || 'followup',
              messages: JSON.stringify(allMessages),
            },
          });
          conversationId = createdConversation.id;
        }
      } else {
        const createdConversation = await prisma.aIConversation.create({
          data: {
            reportId,
            reviewType: followUp ? 'followup' : reviewType,
            messages: JSON.stringify(allMessages),
          },
        });
        conversationId = createdConversation.id;
      }
    } catch {
      // Conversation saving is best-effort; response still returns assistant output.
    }

    return NextResponse.json({
      content: assistantMessage,
      conversationId,
      messages: allMessages,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('AI provider error:', errMsg);
    return NextResponse.json(
      { error: `خطأ من مزود الذكاء الاصطناعي: ${errMsg.slice(0, 200)}` },
      { status: 500 }
    );
  }
}
