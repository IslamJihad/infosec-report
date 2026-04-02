import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getProviderMeta, normalizeAIModel, normalizeAIProvider } from '@/lib/ai/models';
import { generateProviderReply, type ProviderMessage } from '@/lib/ai/providers';
import { getPersistedAppSettings } from '@/lib/db/appSettings';

const SYSTEM_PROMPT = 'أنت خبير أمن معلومات محترف. ردودك دقيقة ومبنية على البيانات المقدمة. تستخدم تنسيق Markdown باللغة العربية. تقدم تحليلات قابلة للتنفيذ.';

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reportId, reviewType, reportData, followUp, question, history } = body;

    // Get API key from settings
    const settings = await getPersistedAppSettings();
    const provider = normalizeAIProvider(settings?.aiProvider);
    const providerMeta = getProviderMeta(provider);
    const modelName = normalizeAIModel(provider, settings?.aiModel);
    const apiKey = provider === 'nvidia'
      ? (settings?.nvidiaApiKey || '')
      : (settings?.geminiApiKey || settings?.aiApiKey || '');

    if (!apiKey) {
      return NextResponse.json(
        { error: `مفتاح API غير مُعدّ لمزود ${providerMeta.label}. يرجى إضافته من صفحة الإعدادات.` },
        { status: 400 }
      );
    }

    let providerHistory: ProviderMessage[] = [];
    let userMessage: string;

    if (followUp && history) {
      providerHistory = toProviderHistory(history);
      userMessage = question;
    } else {
      // Build prompt based on review type
      const dataStr = JSON.stringify(reportData, null, 2);
      const prompts: Record<string, string> = {
        full: `أنت CISO خبير (كبير مسؤولي أمن المعلومات). راجع بيانات تقرير أمن المعلومات التالي وقدّم مراجعة شاملة باللغة العربية. كن دقيقاً ومبنياً على البيانات:\n\n${dataStr}\n\n## 🏆 نقاط القوة\n## ⚠️ نقاط الضعف\n## 🚨 تنبيهات عاجلة\n## 💡 توصيات إضافية\n## 📊 التقييم الشامل`,
        exec: `أنت مدير عام تتلقى هذا التقرير الأمني. قدّم رأيك بالعربية بصفتك متلقي التقرير:\n\n${dataStr}\n\n## 👔 ما الذي يهمني كمدير عام\n## ❓ الأسئلة التي سأطرحها\n## 📌 ما يقلقني أكثر\n## ✅ القرارات التي سأتخذها`,
        board: `أنت عضو مجلس إدارة غير تقني تتلقى هذا التقرير الأمني. قدّم تحليلك بالعربية بصفتك عضو مجلس إدارة يهتم بالأثر المالي واستمرارية الأعمال:\n\n${dataStr}\n\n## 🏛️ الملخص لمجلس الإدارة — ماذا يعني هذا للأعمال؟\n## 💰 الأثر المالي والمخاطر التشغيلية\n## 📊 هل الاستثمار الأمني كافٍ ومُجدٍ؟\n## ⚖️ المسؤولية القانونية والامتثال\n## 🎯 القرارات المطلوبة من المجلس`,
        risk: `أنت خبير إدارة مخاطر أمن المعلومات. حلّل المخاطر التالية بعمق باللغة العربية:\n\n${dataStr}\n\n## 🎯 تقييم دقة التصنيف\n## 🔴 المخاطر الأعلى أولوية\n## 🕳️ مخاطر غير مذكورة محتملة\n## 📐 توصيات لتحسين إدارة المخاطر`,
        gaps: `أنت مدقق أمن معلومات. ابحث عن النقاط المفقودة والفجوات في التقرير التالي باللغة العربية:\n\n${dataStr}\n\n## 🕳️ المعلومات الناقصة\n## 📋 أقسام يجب إضافتها\n## 🌐 مخاطر خارجية غير مذكورة\n## ✅ قائمة تحقق لتقرير مكتمل`,
      };

      userMessage = prompts[reviewType] || prompts.full;
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

    // Save conversation
    if (reportId) {
      const existingMsgs = followUp ? providerHistory : [];
      const allMessages = [
        ...existingMsgs,
        ...(followUp ? [{ role: 'user', content: question }] : [{ role: 'user', content: `مراجعة: ${reviewType}` }]),
        { role: 'assistant', content: assistantMessage },
      ];

      await prisma.aIConversation.upsert({
        where: { id: reportId + '-' + (reviewType || 'followup') },
        update: { messages: JSON.stringify(allMessages) },
        create: {
          id: reportId + '-' + (reviewType || 'followup'),
          reportId,
          reviewType: reviewType || 'followup',
          messages: JSON.stringify(allMessages),
        },
      }).catch(() => {
        // conversation save is best-effort
      });
    }

    return NextResponse.json({
      content: assistantMessage,
      messages: followUp
        ? [...providerHistory, { role: 'user', content: question }, { role: 'assistant', content: assistantMessage }]
        : [{ role: 'user', content: `مراجعة: ${reviewType}` }, { role: 'assistant', content: assistantMessage }],
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
