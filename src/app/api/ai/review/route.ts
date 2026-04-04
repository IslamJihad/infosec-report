import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { getProviderMeta, normalizeAIModel, normalizeAIProvider } from '@/lib/ai/models';
import { generateProviderReply, type ProviderMessage } from '@/lib/ai/providers';
import { getPersistedAppSettings } from '@/lib/db/appSettings';

const SYSTEM_PROMPT = 'أنت خبير أمن معلومات محترف. ردودك دقيقة ومبنية على البيانات المقدمة. تستخدم تنسيق Markdown باللغة العربية. تقدم تحليلات قابلة للتنفيذ.';
const REVIEW_TYPES = ['full', 'exec', 'board', 'risk', 'gaps'] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_REPORT_DATA_BYTES = 120_000;
const MAX_HISTORY_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_QUESTION_CHARS = 1_200;

type ReviewType = typeof REVIEW_TYPES[number];

const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
});

const AIReviewBodySchema = z.object({
  reportId: z.string().trim().regex(UUID_PATTERN),
  reviewType: z.enum(REVIEW_TYPES).optional(),
  reportData: z.unknown().optional(),
  followUp: z.boolean().optional(),
  question: z.string().trim().max(MAX_QUESTION_CHARS).optional(),
  history: z.array(HistoryMessageSchema).max(MAX_HISTORY_MESSAGES).optional(),
  conversationId: z.string().trim().regex(UUID_PATTERN).optional(),
});

function resolveReviewType(value: unknown): ReviewType {
  return typeof value === 'string' && (REVIEW_TYPES as readonly string[]).includes(value)
    ? (value as ReviewType)
    : 'full';
}

function serializedSize(value: unknown): number | null {
  try {
    return new TextEncoder().encode(JSON.stringify(value ?? {})).length;
  } catch {
    return null;
  }
}

function sanitizeReportDataForPrompt(reportData: unknown): unknown {
  if (!reportData || typeof reportData !== 'object' || Array.isArray(reportData)) {
    return reportData;
  }

  const clone = { ...(reportData as Record<string, unknown>) };
  if (typeof clone.logoBase64 === 'string' && clone.logoBase64.length > 0) {
    clone.logoBase64 = '[تمت إزالة بيانات الشعار الثنائية]';
  }

  return clone;
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
  const dataStr = JSON.stringify(sanitizeReportDataForPrompt(reportData) ?? {}, null, 2);
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
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json({ error: 'بيانات الطلب غير صالحة.' }, { status: 400 });
    }

    const parsedBody = AIReviewBodySchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'تعذر التحقق من بيانات الطلب.' }, { status: 400 });
    }

    const body = parsedBody.data;
    const reportId = body.reportId;
    const reviewType = resolveReviewType(body.reviewType);
    const followUp = body.followUp === true;
    const question = body.question?.trim() || '';
    const inputConversationId = body.conversationId || '';

    if (!followUp) {
      const reportDataBytes = serializedSize(body.reportData);
      if (reportDataBytes === null || reportDataBytes > MAX_REPORT_DATA_BYTES) {
        return NextResponse.json(
          { error: 'حجم بيانات التقرير كبير جداً للمراجعة الذكية الحالية.' },
          { status: 400 }
        );
      }
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
              reviewType: 'followup',
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
    } catch (persistenceError) {
      console.error('AI conversation persistence error:', persistenceError);
    }

    return NextResponse.json({
      content: assistantMessage,
      conversationId,
      messages: allMessages,
    });
  } catch (error: unknown) {
    console.error('AI provider error:', error);
    return NextResponse.json(
      { error: 'تعذر الحصول على رد من مزود الذكاء الاصطناعي حالياً. حاول مرة أخرى لاحقاً.' },
      { status: 500 }
    );
  }
}
