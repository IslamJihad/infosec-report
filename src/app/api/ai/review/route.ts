import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reportId, reviewType, reportData, followUp, question, history } = body;

    // Get API key from settings
    const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } });
    if (!settings?.aiApiKey) {
      return NextResponse.json(
        { error: 'مفتاح API غير مُعدّ. يرجى إضافته من صفحة الإعدادات.' },
        { status: 400 }
      );
    }

    const apiKey = settings.aiApiKey;
    const model = settings.aiModel || 'sonar';

    let messages: Array<{ role: string; content: string }>;

    if (followUp && history) {
      messages = [
        ...history,
        { role: 'user', content: question },
      ];
    } else {
      // Build prompt based on review type
      const dataStr = JSON.stringify(reportData, null, 2);
      const prompts: Record<string, string> = {
        full: `أنت CISO خبير (كبير مسؤولي أمن المعلومات). راجع بيانات تقرير أمن المعلومات التالي وقدّم مراجعة شاملة باللغة العربية. كن دقيقاً ومبنياً على البيانات:\n\n${dataStr}\n\n## 🏆 نقاط القوة\n## ⚠️ نقاط الضعف\n## 🚨 تنبيهات عاجلة\n## 💡 توصيات إضافية\n## 📊 التقييم الشامل`,
        exec: `أنت مدير عام تتلقى هذا التقرير الأمني. قدّم رأيك بالعربية بصفتك متلقي التقرير:\n\n${dataStr}\n\n## 👔 ما الذي يهمني كمدير عام\n## ❓ الأسئلة التي سأطرحها\n## 📌 ما يقلقني أكثر\n## ✅ القرارات التي سأتخذها`,
        risk: `أنت خبير إدارة مخاطر أمن المعلومات. حلّل المخاطر التالية بعمق باللغة العربية:\n\n${dataStr}\n\n## 🎯 تقييم دقة التصنيف\n## 🔴 المخاطر الأعلى أولوية\n## 🕳️ مخاطر غير مذكورة محتملة\n## 📐 توصيات لتحسين إدارة المخاطر`,
        gaps: `أنت مدقق أمن معلومات. ابحث عن النقاط المفقودة والفجوات في التقرير التالي باللغة العربية:\n\n${dataStr}\n\n## 🕳️ المعلومات الناقصة\n## 📋 أقسام يجب إضافتها\n## 🌐 مخاطر خارجية غير مذكورة\n## ✅ قائمة تحقق لتقرير مكتمل`,
      };

      messages = [
        {
          role: 'system',
          content: 'أنت خبير أمن معلومات محترف. ردودك دقيقة ومبنية على البيانات المقدمة. تستخدم تنسيق Markdown باللغة العربية. تقدم تحليلات قابلة للتنفيذ.',
        },
        { role: 'user', content: prompts[reviewType] || prompts.full },
      ];
    }

    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Perplexity API error:', errData);
      return NextResponse.json(
        { error: `خطأ من API الذكاء الاصطناعي: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    const assistantMessage = result.choices?.[0]?.message?.content || 'لا يوجد رد';

    // Save conversation
    if (reportId) {
      const existingMsgs = followUp && history ? history : [];
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
      messages: followUp && history
        ? [...history, { role: 'user', content: question }, { role: 'assistant', content: assistantMessage }]
        : [{ role: 'user', content: `مراجعة: ${reviewType}` }, { role: 'assistant', content: assistantMessage }],
    });
  } catch (error) {
    console.error('AI review error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي' },
      { status: 500 }
    );
  }
}
