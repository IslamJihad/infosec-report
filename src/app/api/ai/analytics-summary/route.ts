import { NextResponse } from 'next/server';
import type {
  AnalyticsAISummaryRequest,
  AnalyticsAISummaryResponse,
  AnalyticsQueryOptions,
  AnalyticsSummaryAudience,
} from '@/types/analytics';
import {
  getAnalyticsSnapshotFromNormalized,
  normalizeAnalyticsQuery,
  normalizedQueryToOptions,
} from '@/lib/analytics/snapshot';
import { generateProviderReply } from '@/lib/ai/providers';
import { getProviderMeta, normalizeAIModel, normalizeAIProvider } from '@/lib/ai/models';
import { getPersistedAppSettings } from '@/lib/db/appSettings';

const SYSTEM_PROMPT = [
  'أنت مستشار تحليلات أمن معلومات للإدارة العليا.',
  'مهمتك تقديم ملخص تنفيذي عربي واضح مبني فقط على البيانات المرفقة.',
  'قواعد إلزامية:',
  '1) لا تستخدم أي معلومة خارج البيانات المرفقة.',
  '2) اربط كل استنتاج برقم أو مؤشر واضح.',
  '3) إذا كانت البيانات غير كافية فاذكر ذلك صراحة.',
  '4) قدم توصيات استشارية فقط، بدون أي تنفيذ تلقائي.',
  '5) استخدم تنسيق Markdown وعناوين قصيرة.',
].join('\n');

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

type CachedSummary = Omit<AnalyticsAISummaryResponse, 'cacheHit'> & { expiresAt: number };

const summaryCache = new Map<string, CachedSummary>();

function normalizeAudience(value: unknown): AnalyticsSummaryAudience {
  if (value === 'board' || value === 'ciso') return value;
  return 'leadership';
}

function pruneSummaryCache(now: number): void {
  for (const [key, cachedValue] of summaryCache.entries()) {
    if (cachedValue.expiresAt <= now) {
      summaryCache.delete(key);
    }
  }

  while (summaryCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = summaryCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    summaryCache.delete(oldestKey);
  }
}

function buildAudienceGuidance(audience: AnalyticsSummaryAudience): string {
  if (audience === 'board') {
    return 'التركيز: المخاطر الاستراتيجية، الأثر على الأعمال، والقرارات المطلوبة من مجلس الإدارة.';
  }

  if (audience === 'ciso') {
    return 'التركيز: أولويات المخاطر، فجوات الضوابط، وخطة التنفيذ خلال 30 يوماً.';
  }

  return 'التركيز: وضوح تنفيذي، أهم المخاطر الحالية، وما الذي يجب فعله الآن.';
}

function buildQueryHash(options: AnalyticsQueryOptions, audience: AnalyticsSummaryAudience): string {
  return JSON.stringify({
    audience,
    from: options.from || '',
    to: options.to || '',
    limit: options.limit ?? 24,
    groupBy: options.groupBy || 'none',
    riskSeverity: options.riskSeverity || '',
    riskStatus: options.riskStatus || '',
    reportId: options.reportId || '',
  });
}

function buildSnapshotContext(snapshot: Awaited<ReturnType<typeof getAnalyticsSnapshotFromNormalized>>): string {
  const topRisks = snapshot.topRisks
    .slice(0, 5)
    .map((risk, index) => (
      `${index + 1}. ${risk.reportName} | ${risk.system || 'غير محدد'} | الشدة: ${risk.severity} | الحالة: ${risk.status} | الدرجة: ${risk.score}`
    ))
    .join('\n') || 'لا توجد مخاطر ضمن المرشح الحالي.';

  const weakIsoDomains = [...snapshot.isoCoverage]
    .sort((a, b) => a.coverage - b.coverage)
    .slice(0, 4)
    .map((domain) => `${domain.domainId} ${domain.domainName}: ${domain.coverage}% (${domain.applied}/${domain.total})`)
    .join('\n') || 'لا توجد بيانات ISO.';

  const recentTrend = snapshot.trend
    .slice(-6)
    .map((point) => `${point.date.slice(0, 10)} | أمن: ${point.securityScore} | امتثال: ${point.compliance} | مخاطر: ${point.riskCount}`)
    .join('\n') || 'لا يوجد اتجاه تاريخي كاف.';

  return [
    '### ملخص المؤشرات الأساسية',
    `- إجمالي التقارير: ${snapshot.summary.totalReports}`,
    `- متوسط درجة الأمن: ${snapshot.summary.avgSecurityScore}/100`,
    `- متوسط الامتثال: ${snapshot.summary.avgCompliance}%`,
    `- صافي تغير الامتثال: ${snapshot.summary.complianceDelta}`,
    `- المخاطر المفتوحة: ${snapshot.summary.openRisks}`,
    `- المخاطر الحرجة: ${snapshot.summary.criticalRisks}`,
    `- التغطية الإجمالية ISO: ${snapshot.overallIsoCoverage}%`,
    `- معدل إغلاق المخاطر: ${snapshot.velocity.closureRate}%`,
    `- التعرض الحرج: ${snapshot.velocity.criticalExposure}%`,
    '',
    '### أعلى المخاطر',
    topRisks,
    '',
    '### أضعف مجالات ISO تغطية',
    weakIsoDomains,
    '',
    '### اتجاه زمني حديث',
    recentTrend,
  ].join('\n');
}

function buildNoDataSummary(audience: AnalyticsSummaryAudience): string {
  return [
    '## الملخص التنفيذي',
    'لا توجد بيانات كافية ضمن المرشحات الحالية لإنتاج تحليل موثوق.',
    '',
    '## ماذا نفعل الآن',
    '1. وسّع نطاق التاريخ أو زد عدد التقارير.',
    '2. تأكد من وجود مخاطر وبيانات ISO داخل التقارير.',
    '3. أعد توليد الملخص بعد تحديث البيانات.',
    '',
    `## منظور الجمهور (${audience})`,
    'المخرجات استشارية فقط وليست تنفيذية تلقائية.',
  ].join('\n');
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as AnalyticsAISummaryRequest;
    const audience = normalizeAudience(body.audience);
    const forceRefresh = body.forceRefresh === true;

    const normalizedQuery = normalizeAnalyticsQuery(body);
    if (normalizedQuery.from && normalizedQuery.to && normalizedQuery.from > normalizedQuery.to) {
      return NextResponse.json({ error: 'تاريخ البداية يجب أن يسبق تاريخ النهاية.' }, { status: 400 });
    }

    const queryOptions = normalizedQueryToOptions(normalizedQuery);

    const settings = await getPersistedAppSettings();
    const provider = normalizeAIProvider(settings.aiProvider);
    const model = normalizeAIModel(provider, settings.aiModel);
    const providerMeta = getProviderMeta(provider);
    const apiKey = provider === 'nvidia'
      ? (settings.nvidiaApiKey || '')
      : (settings.geminiApiKey || settings.aiApiKey || '');

    if (!apiKey) {
      return NextResponse.json(
        { error: `مفتاح API غير مُعدّ لمزود ${providerMeta.label}. يرجى إضافته من صفحة الإعدادات.` },
        { status: 400 }
      );
    }

    const queryHash = buildQueryHash(queryOptions, audience);
    const cacheKey = `${provider}|${model}|${queryHash}`;
    const now = Date.now();
    pruneSummaryCache(now);

    const cached = summaryCache.get(cacheKey);
    if (!forceRefresh && cached && cached.expiresAt > now) {
      return NextResponse.json({
        ...cached,
        cacheHit: true,
      } satisfies AnalyticsAISummaryResponse);
    }

    const snapshot = await getAnalyticsSnapshotFromNormalized(normalizedQuery);

    const generatedAt = new Date().toISOString();
    let content = '';

    if (snapshot.summary.totalReports === 0) {
      content = buildNoDataSummary(audience);
    } else {
      content = await generateProviderReply({
        provider,
        apiKey,
        model,
        systemPrompt: SYSTEM_PROMPT,
        history: [],
        userMessage: [
          `الجمهور المستهدف: ${audience}`,
          buildAudienceGuidance(audience),
          'المخرجات المطلوبة (Markdown):',
          '## الملخص التنفيذي',
          '## أهم المخاطر الآن',
          '## الفرص السريعة خلال 30 يوماً',
          '## قرارات مقترحة للإدارة',
          '## مستوى الثقة (مرتفع/متوسط/منخفض) مع سبب',
          '',
          'لقطة البيانات:',
          buildSnapshotContext(snapshot),
        ].join('\n'),
        maxOutputTokens: 1600,
        temperature: 0.25,
      });
    }

    const response: AnalyticsAISummaryResponse = {
      content,
      audience,
      generatedAt,
      cacheHit: false,
      provider,
      model,
      queryHash,
      keyMetrics: {
        totalReports: snapshot.summary.totalReports,
        avgSecurityScore: snapshot.summary.avgSecurityScore,
        openRisks: snapshot.summary.openRisks,
        criticalRisks: snapshot.summary.criticalRisks,
        overallIsoCoverage: snapshot.overallIsoCoverage,
        complianceDelta: snapshot.summary.complianceDelta,
      },
    };

    summaryCache.set(cacheKey, {
      ...response,
      expiresAt: now + CACHE_TTL_MS,
    });

    pruneSummaryCache(now);

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('AI analytics summary generation failed:', error);
    return NextResponse.json(
      { error: 'فشل توليد الملخص التنفيذي الذكي' },
      { status: 500 }
    );
  }
}
