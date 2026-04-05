import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getPersistedAppSettings } from '@/lib/db/appSettings';
import {
  getProviderMeta,
  normalizeAIModel,
  normalizeAIProvider,
  type AIProvider,
} from '@/lib/ai/models';
import {
  generateProviderReply,
  generateProviderReplyStream,
  type ProviderMessage,
} from '@/lib/ai/providers';
import type { AIMessage, AIReviewRecommendation, ResponseLength, ReviewType } from '@/types/report';

const SYSTEM_PROMPT = 'أنت خبير أمن معلومات محترف. ردودك دقيقة ومبنية على البيانات المقدمة. تستخدم تنسيق Markdown باللغة العربية. تقدم تحليلات قابلة للتنفيذ.';
const REVIEW_TYPES = ['full', 'exec', 'board', 'risk', 'gaps'] as const;
const RESPONSE_LENGTHS = ['brief', 'standard', 'detailed'] as const;
const ACTIONS = ['review', 'recommend'] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_REPORT_DATA_BYTES = 120_000;
const MAX_HISTORY_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_QUESTION_CHARS = 1_200;
const MAX_SUGGESTION_SOURCE_CHARS = 7_000;

const DEFAULT_SUGGESTIONS = [
  'ما أهم 3 مخاطر يجب البدء بها اليوم؟',
  'اقترح خطة تنفيذ لمدة 30 يوما.',
  'كيف أشرح هذا الملخص للإدارة العليا؟',
];

const RESPONSE_LENGTH_CONFIG: Record<ResponseLength, { instruction: string; maxOutputTokens: number }> = {
  brief: {
    instruction: 'اجعل ردك مختصراً في 3-5 نقاط فقط.',
    maxOutputTokens: 600,
  },
  standard: {
    instruction: '',
    maxOutputTokens: 2000,
  },
  detailed: {
    instruction: 'اجعل ردك مفصلاً وشاملاً مع أمثلة وتوضيحات.',
    maxOutputTokens: 4000,
  },
};

type AIAction = typeof ACTIONS[number];

const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
  timestamp: z.string().trim().max(64).optional(),
});

const AIReviewBodySchema = z.object({
  reportId: z.string().trim().regex(UUID_PATTERN),
  reviewType: z.enum(REVIEW_TYPES).optional(),
  reportData: z.unknown().optional(),
  followUp: z.boolean().optional(),
  question: z.string().trim().max(MAX_QUESTION_CHARS).optional(),
  history: z.array(HistoryMessageSchema).max(MAX_HISTORY_MESSAGES).optional(),
  conversationId: z.string().trim().regex(UUID_PATTERN).optional(),
  responseLength: z.enum(RESPONSE_LENGTHS).optional(),
  action: z.enum(ACTIONS).optional(),
  stream: z.boolean().optional(),
});

function resolveReviewType(value: unknown): ReviewType {
  return typeof value === 'string' && (REVIEW_TYPES as readonly string[]).includes(value)
    ? (value as ReviewType)
    : 'full';
}

function resolveResponseLength(value: unknown): ResponseLength {
  return typeof value === 'string' && (RESPONSE_LENGTHS as readonly string[]).includes(value)
    ? (value as ResponseLength)
    : 'standard';
}

function resolveAction(value: unknown): AIAction {
  return typeof value === 'string' && (ACTIONS as readonly string[]).includes(value)
    ? (value as AIAction)
    : 'review';
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

function toConversationHistory(history: unknown): AIMessage[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter((message): message is { role: string; content: string } => {
      if (!message || typeof message !== 'object') return false;
      const candidate = message as { role?: unknown; content?: unknown; timestamp?: unknown };
      return typeof candidate.role === 'string' && typeof candidate.content === 'string';
    })
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role as 'user' | 'assistant',
      content: message.content,
      timestamp:
        typeof (message as { timestamp?: unknown }).timestamp === 'string'
          ? ((message as { timestamp?: string }).timestamp || undefined)
          : undefined,
    }));
}

function toProviderHistory(history: AIMessage[]): ProviderMessage[] {
  return history.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function safeParseMessages(raw: string): AIMessage[] {
  try {
    return toConversationHistory(JSON.parse(raw));
  } catch {
    return [];
  }
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

function withLengthInstruction(message: string, responseLength: ResponseLength): string {
  const config = RESPONSE_LENGTH_CONFIG[responseLength];
  if (!config.instruction) return message;
  return `${message}\n\n${config.instruction}`;
}

function parseSuggestions(raw: string): string[] {
  const normalized = raw.replace(/\r/g, '\n').trim();
  if (!normalized) return [];

  const splitByPrimary = normalized.includes('|||')
    ? normalized.split('|||')
    : normalized.split('\n');

  const cleaned = splitByPrimary
    .map((item) => item.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean);

  const unique: string[] = [];
  for (const item of cleaned) {
    if (!unique.includes(item)) {
      unique.push(item);
    }
    if (unique.length >= 3) break;
  }

  return unique;
}

function normalizeRecommendedType(raw: string): ReviewType | null {
  const lower = raw.trim().toLowerCase();
  if (!lower) return null;

  if (['full', 'comprehensive'].includes(lower) || lower.includes('شامل')) return 'full';
  if (['exec', 'executive'].includes(lower) || lower.includes('تنفيذي') || lower.includes('الإدارة')) return 'exec';
  if (['board'].includes(lower) || lower.includes('مجلس')) return 'board';
  if (['risk'].includes(lower) || lower.includes('مخاطر')) return 'risk';
  if (['gaps', 'gap'].includes(lower) || lower.includes('ثغرات') || lower.includes('فجوات')) return 'gaps';

  return null;
}

function parseRecommendation(raw: string): AIReviewRecommendation {
  const fallback: AIReviewRecommendation = {
    recommended: 'risk',
    reason: 'التقرير يحتوي على إشارات تحتاج إلى تحليل مخاطر مباشر.',
  };

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { recommended?: string; reason?: string };
      const recommended = normalizeRecommendedType(parsed.recommended || '');
      if (recommended) {
        return {
          recommended,
          reason: (parsed.reason || '').trim() || fallback.reason,
        };
      }
    } catch {
      // Fall through to heuristic parsing.
    }
  }

  const recommended = normalizeRecommendedType(raw) ?? fallback.recommended;
  const reason = raw.replace(/\s+/g, ' ').trim();
  return {
    recommended,
    reason: reason || fallback.reason,
  };
}

function buildRecommendationPrompt(reportData: unknown): string {
  const dataStr = JSON.stringify(sanitizeReportDataForPrompt(reportData) ?? {}, null, 2);
  return `حلل بيانات التقرير التالي واختر نوع مراجعة واحد فقط من: full أو exec أو board أو risk أو gaps.\nأعد الإجابة بصيغة JSON فقط بالشكل التالي:\n{"recommended":"risk","reason":"سبب مختصر بالعربية"}\n\nبيانات التقرير:\n${dataStr}`;
}

async function generateFollowUpSuggestions(params: {
  provider: AIProvider;
  apiKey: string;
  modelName: string;
  assistantMessage: string;
}): Promise<string[]> {
  const source = params.assistantMessage.trim().slice(0, MAX_SUGGESTION_SOURCE_CHARS);
  if (!source) return [...DEFAULT_SUGGESTIONS];

  try {
    const raw = await generateProviderReply({
      provider: params.provider,
      apiKey: params.apiKey,
      model: params.modelName,
      systemPrompt: SYSTEM_PROMPT,
      history: [],
      userMessage: `بناءً على هذا الرد، اقترح 3 أسئلة متابعة قصيرة ومفيدة. أعطني فقط الأسئلة الثلاثة مفصولة بـ|||\n\n${source}`,
      maxOutputTokens: 220,
      temperature: 0.5,
    });

    const suggestions = parseSuggestions(raw);
    return suggestions.length === 3 ? suggestions : [...DEFAULT_SUGGESTIONS];
  } catch (error) {
    console.error('AI suggestions generation error:', error);
    return [...DEFAULT_SUGGESTIONS];
  }
}

async function persistConversation(params: {
  followUp: boolean;
  inputConversationId: string;
  reportId: string;
  reviewType: ReviewType;
  allMessages: AIMessage[];
}): Promise<string | null> {
  try {
    if (params.followUp && params.inputConversationId) {
      const existingConversation = await prisma.aIConversation.findUnique({
        where: { id: params.inputConversationId },
      });

      if (existingConversation?.reportId === params.reportId) {
        await prisma.aIConversation.update({
          where: { id: existingConversation.id },
          data: { messages: JSON.stringify(params.allMessages) },
        });
        return existingConversation.id;
      }

      const createdConversation = await prisma.aIConversation.create({
        data: {
          reportId: params.reportId,
          reviewType: 'followup',
          messages: JSON.stringify(params.allMessages),
        },
      });
      return createdConversation.id;
    }

    const createdConversation = await prisma.aIConversation.create({
      data: {
        reportId: params.reportId,
        reviewType: params.followUp ? 'followup' : params.reviewType,
        messages: JSON.stringify(params.allMessages),
      },
    });

    return createdConversation.id;
  } catch (persistenceError) {
    console.error('AI conversation persistence error:', persistenceError);
    return null;
  }
}

function buildStreamResponse(params: {
  provider: AIProvider;
  apiKey: string;
  modelName: string;
  systemPrompt: string;
  providerHistory: ProviderMessage[];
  userMessageForModel: string;
  maxOutputTokens: number;
  conversationHistory: AIMessage[];
  followUp: boolean;
  question: string;
  reviewType: ReviewType;
  reportId: string;
  inputConversationId: string;
}) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let assembled = '';

        for await (const chunk of generateProviderReplyStream({
          provider: params.provider,
          apiKey: params.apiKey,
          model: params.modelName,
          systemPrompt: params.systemPrompt,
          history: params.providerHistory,
          userMessage: params.userMessageForModel,
          maxOutputTokens: params.maxOutputTokens,
          temperature: 0.3,
        })) {
          if (!chunk) continue;
          assembled += chunk;
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'chunk', chunk })}\n`));
        }

        const assistantMessage = assembled.trim() || 'لا يوجد رد';
        const nowIso = new Date().toISOString();
        const newUserMessage: AIMessage = params.followUp
          ? { role: 'user', content: params.question, timestamp: nowIso }
          : { role: 'user', content: `مراجعة: ${params.reviewType}`, timestamp: nowIso };

        const allMessages: AIMessage[] = [
          ...params.conversationHistory,
          newUserMessage,
          { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() },
        ];

        const [suggestions, conversationId] = await Promise.all([
          generateFollowUpSuggestions({
            provider: params.provider,
            apiKey: params.apiKey,
            modelName: params.modelName,
            assistantMessage,
          }),
          persistConversation({
            followUp: params.followUp,
            inputConversationId: params.inputConversationId,
            reportId: params.reportId,
            reviewType: params.reviewType,
            allMessages,
          }),
        ]);

        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({
              type: 'done',
              content: assistantMessage,
              messages: allMessages,
              conversationId,
              suggestions,
            })}\n`
          )
        );
      } catch (error) {
        console.error('AI streaming route error:', error);
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({
              type: 'error',
              error: 'تعذر إكمال البث من مزود الذكاء الاصطناعي.',
            })}\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
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
    const action = resolveAction(body.action);
    const reviewType = resolveReviewType(body.reviewType);
    const responseLength = resolveResponseLength(body.responseLength);
    const followUp = body.followUp === true;
    const streamRequested = body.stream === true;
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

    if (action === 'recommend' && followUp) {
      return NextResponse.json({ error: 'وضع التوصية لا يدعم أسئلة المتابعة.' }, { status: 400 });
    }

    if (action === 'review' && followUp && !question) {
      return NextResponse.json({ error: 'يرجى إدخال سؤال المتابعة.' }, { status: 400 });
    }

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

    if (action === 'recommend') {
      const recommendationRaw = await generateProviderReply({
        provider,
        apiKey,
        model: modelName,
        systemPrompt: SYSTEM_PROMPT,
        history: [],
        userMessage: buildRecommendationPrompt(body.reportData),
        maxOutputTokens: 120,
        temperature: 0,
      });

      const recommendation = parseRecommendation(recommendationRaw);
      return NextResponse.json(recommendation);
    }

    let conversationHistory: AIMessage[] = [];
    let providerHistory: ProviderMessage[] = [];

    if (followUp) {
      conversationHistory = toConversationHistory(body.history);
      providerHistory = toProviderHistory(conversationHistory);

      if (!providerHistory.length && inputConversationId) {
        const existingConversation = await prisma.aIConversation.findUnique({ where: { id: inputConversationId } });
        if (existingConversation?.reportId === reportId) {
          conversationHistory = safeParseMessages(existingConversation.messages);
          providerHistory = toProviderHistory(conversationHistory);
        }
      }
    }

    const baseUserMessage = followUp
      ? question
      : buildInitialPrompt(reviewType, body.reportData);
    const userMessageForModel = withLengthInstruction(baseUserMessage, responseLength);
    const maxOutputTokens = RESPONSE_LENGTH_CONFIG[responseLength].maxOutputTokens;

    if (streamRequested) {
      return buildStreamResponse({
        provider,
        apiKey,
        modelName,
        systemPrompt: SYSTEM_PROMPT,
        providerHistory,
        userMessageForModel,
        maxOutputTokens,
        conversationHistory,
        followUp,
        question,
        reviewType,
        reportId,
        inputConversationId,
      });
    }

    const assistantMessage = await generateProviderReply({
      provider,
      apiKey,
      model: modelName,
      systemPrompt: SYSTEM_PROMPT,
      history: providerHistory,
      userMessage: userMessageForModel,
      maxOutputTokens,
      temperature: 0.3,
    });

    const nowIso = new Date().toISOString();
    const newUserMessage: AIMessage = followUp
      ? { role: 'user', content: question, timestamp: nowIso }
      : { role: 'user', content: `مراجعة: ${reviewType}`, timestamp: nowIso };

    const allMessages: AIMessage[] = [
      ...conversationHistory,
      newUserMessage,
      { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() },
    ];

    const [suggestions, conversationId] = await Promise.all([
      generateFollowUpSuggestions({
        provider,
        apiKey,
        modelName,
        assistantMessage,
      }),
      persistConversation({
        followUp,
        inputConversationId,
        reportId,
        reviewType,
        allMessages,
      }),
    ]);

    return NextResponse.json({
      content: assistantMessage,
      conversationId,
      messages: allMessages,
      suggestions,
    });
  } catch (error: unknown) {
    console.error('AI provider error:', error);
    return NextResponse.json(
      { error: 'تعذر الحصول على رد من مزود الذكاء الاصطناعي حالياً. حاول مرة أخرى لاحقاً.' },
      { status: 500 }
    );
  }
}
