import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getPersistedAppSettings } from '@/lib/db/appSettings';
import { buildPercentileMap, calculateGlobalSecurityScore } from '@/lib/scoring';
import { parseSPSDomainsJson } from '@/lib/spsDomains';

const REPORT_INCLUDE = {
  decisions: { orderBy: { sortOrder: 'asc' as const } },
  risks: { orderBy: { sortOrder: 'asc' as const } },
  maturityDomains: { orderBy: { sortOrder: 'asc' as const } },
  recommendations: { orderBy: { sortOrder: 'asc' as const } },
  challenges: { orderBy: { sortOrder: 'asc' as const } },
  efficiencyKPIs: { orderBy: { sortOrder: 'asc' as const } },
};

async function buildReportPercentiles(currentReportId?: string, currentScore?: number) {
  const allScores = await prisma.report.findMany({
    select: { id: true, securityScore: true },
  });

  const normalizedScores = allScores.map((entry) => {
    if (currentReportId && typeof currentScore === 'number' && entry.id === currentReportId) {
      return { ...entry, securityScore: currentScore };
    }
    return entry;
  });

  return buildPercentileMap(normalizedScores);
}

export async function GET() {
  try {
    const reports = await prisma.report.findMany({
      include: REPORT_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });

    const scoredReports = reports.map((report) => {
      const spsDomains = parseSPSDomainsJson(report.spsDomainsJson);
      const scoreResult = calculateGlobalSecurityScore({ id: report.id, spsDomains });

      return {
        ...report,
        spsDomains,
        securityScore: scoreResult.securityScore,
        scoreBreakdown: scoreResult.scoreBreakdown,
      };
    });

    const percentileMap = buildPercentileMap(
      scoredReports.map((report) => ({ id: report.id, securityScore: report.securityScore })),
    );

    return NextResponse.json(
      scoredReports.map((report) => ({
        ...report,
        scorePercentile: percentileMap[report.id] ?? 0,
      })),
    );
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'فشل في تحميل التقارير' }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Get default settings
    const settings = await getPersistedAppSettings();

    const report = await prisma.report.create({
      data: {
        title: 'تقرير أمن المعلومات',
        orgName: settings?.defaultOrgName || 'شركة المستقبل للتقنية',
        recipientName: '',
        period: `Q1 – ${new Date().getFullYear()}`,
        issueDate: new Date().toISOString().split('T')[0],
        version: '1.0',
        author: settings?.defaultAuthor || 'إدارة أمن المعلومات',
        classification: 'سري',
        summary: '',
        securityLevel: 'متوسط',
        trend: 'مستقر →',
        status: 'draft',

        decisions: {
          create: [
            {
              title: 'اعتماد ميزانية طارئة لسد الثغرات الحرجة',
              description: 'يُطلب اعتماد ميزانية طارئة لمعالجة الثغرات الحرجة التي تُشكّل خطراً فورياً.',
              budget: '150,000',
              department: 'المدير المالي',
              timeline: 'فوري',
              owner: 'الرئيس التنفيذي',
              sortOrder: 0,
            },
          ],
        },

        risks: {
          create: [
            { description: 'ثغرة RDP تسمح بالوصول غير المصرح به', system: 'خوادم Windows', severity: 'critical', status: 'open', probability: 5, impact: 5, worstCase: 'توقف تام للخوادم وتسريب بيانات حساسة', sortOrder: 0 },
            { description: 'غياب تشفير البيانات أثناء النقل الداخلي', system: 'شبكة LAN', severity: 'critical', status: 'open', probability: 4, impact: 5, worstCase: 'اعتراض البيانات وسرقتها', sortOrder: 1 },
            { description: 'كلمات مرور ضعيفة لحسابات المدراء', system: 'Active Directory', severity: 'high', status: 'inprogress', probability: 4, impact: 4, worstCase: 'اختراق حسابات بصلاحيات عالية', sortOrder: 2 },
          ],
        },

        maturityDomains: {
          create: [
            { name: 'أمن الشبكة', score: 60, sortOrder: 0 },
            { name: 'إدارة الهوية والوصول', score: 40, sortOrder: 1 },
            { name: 'حماية البيانات', score: 60, sortOrder: 2 },
            { name: 'أمن التطبيقات', score: 40, sortOrder: 3 },
            { name: 'الاستجابة للحوادث', score: 60, sortOrder: 4 },
            { name: 'الوعي الأمني', score: 40, sortOrder: 5 },
            { name: 'الامتثال والحوكمة', score: 80, sortOrder: 6 },
            { name: 'إدارة الثغرات', score: 60, sortOrder: 7 },
          ],
        },

        recommendations: {
          create: [
            { title: 'تطبيق MFA على جميع الحسابات الإدارية', description: 'تفعيل المصادقة الثنائية فوراً لجميع الحسابات ذات الصلاحيات العالية.', priority: 'high', department: 'تقنية المعلومات', timeline: '30 يوماً', owner: 'مدير تقنية المعلومات', sortOrder: 0 },
            { title: 'إغلاق ثغرة RDP وتحديث الأنظمة', description: 'تطبيق التحديثات الأمنية وتقييد الوصول عبر RDP.', priority: 'high', department: 'البنية التحتية', timeline: '7 أيام', owner: 'مدير البنية التحتية', sortOrder: 1 },
          ],
        },

        challenges: {
          create: [
            { title: '12 حادثة مفتوحة تراكمت دون معالجة', type: 'staff', rootCause: 'نقص في كوادر الاستجابة — الفريق مُثقَل', requirement: 'توظيف محلل أمن إضافي', sortOrder: 0 },
            { title: 'وقت الاحتواء يتجاوز الهدف بمقدار الضعف', type: 'tech', rootCause: 'عدم وجود أتمتة في عمليات الاستجابة', requirement: 'تفعيل منصة SOAR واعتماد playbooks جاهزة', sortOrder: 1 },
          ],
        },

        efficiencyKPIs: {
          create: [
            { title: 'معدل اكتشاف التهديدات', val: 78, target: 90, unit: '%', description: 'نسبة التهديدات المكتشفة من إجمالي التهديدات الفعلية', lowerBetter: false, sortOrder: 0 },
            { title: 'متوسط وقت الاكتشاف (MTTD)', val: 4.2, target: 2, unit: 'ساعة', description: 'متوسط الوقت اللازم لاكتشاف الحادثة', lowerBetter: true, sortOrder: 1 },
            { title: 'معدل الإغلاق في الوقت المحدد', val: 72, target: 85, unit: '%', description: 'نسبة الحوادث المغلقة ضمن الإطار الزمني المستهدف', lowerBetter: false, sortOrder: 2 },
            { title: 'فعالية أدوات الأمن', val: 81, target: 90, unit: '%', description: 'نسبة الأدوات الأمنية العاملة بكفاءة كاملة', lowerBetter: false, sortOrder: 3 },
          ],
        },
      },
      include: {
        decisions: { orderBy: { sortOrder: 'asc' } },
        risks: { orderBy: { sortOrder: 'asc' } },
        maturityDomains: { orderBy: { sortOrder: 'asc' } },
        recommendations: { orderBy: { sortOrder: 'asc' } },
        challenges: { orderBy: { sortOrder: 'asc' } },
        efficiencyKPIs: { orderBy: { sortOrder: 'asc' } },
      },
    });

    const spsDomains = parseSPSDomainsJson(report.spsDomainsJson);
    const scoreResult = calculateGlobalSecurityScore({ id: report.id, spsDomains });
    const normalizedSpsDomainsJson = JSON.stringify(spsDomains);

    if (report.securityScore !== scoreResult.securityScore || report.spsDomainsJson !== normalizedSpsDomainsJson) {
      await prisma.report.update({
        where: { id: report.id },
        data: {
          securityScore: scoreResult.securityScore,
          ...(report.spsDomainsJson !== normalizedSpsDomainsJson ? { spsDomainsJson: normalizedSpsDomainsJson } : {}),
        },
      });
    }

    const percentileMap = await buildReportPercentiles(report.id, scoreResult.securityScore);

    return NextResponse.json({
      ...report,
      spsDomains,
      securityScore: scoreResult.securityScore,
      scoreBreakdown: scoreResult.scoreBreakdown,
      scorePercentile: percentileMap[report.id] ?? 0,
    });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'فشل في إنشاء التقرير' }, { status: 500 });
  }
}
