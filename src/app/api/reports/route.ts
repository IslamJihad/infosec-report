import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const reports = await prisma.report.findMany({
      include: {
        decisions: { orderBy: { sortOrder: 'asc' } },
        risks: { orderBy: { sortOrder: 'asc' } },
        maturityDomains: { orderBy: { sortOrder: 'asc' } },
        recommendations: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'فشل في تحميل التقارير' }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Get default settings
    const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } });

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
        securityScore: 50,
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
              sortOrder: 0,
            },
          ],
        },

        risks: {
          create: [
            { description: 'ثغرة RDP تسمح بالوصول غير المصرح به', system: 'خوادم Windows', severity: 'critical', status: 'open', probability: 5, impact: 5, sortOrder: 0 },
            { description: 'غياب تشفير البيانات أثناء النقل الداخلي', system: 'شبكة LAN', severity: 'critical', status: 'open', probability: 4, impact: 5, sortOrder: 1 },
            { description: 'كلمات مرور ضعيفة لحسابات المدراء', system: 'Active Directory', severity: 'high', status: 'inprogress', probability: 4, impact: 4, sortOrder: 2 },
          ],
        },

        maturityDomains: {
          create: [
            { name: 'أمن الشبكة', score: 3, sortOrder: 0 },
            { name: 'إدارة الهوية والوصول', score: 2, sortOrder: 1 },
            { name: 'حماية البيانات', score: 3, sortOrder: 2 },
            { name: 'أمن التطبيقات', score: 2, sortOrder: 3 },
            { name: 'الاستجابة للحوادث', score: 3, sortOrder: 4 },
            { name: 'الوعي الأمني', score: 2, sortOrder: 5 },
            { name: 'الامتثال والحوكمة', score: 4, sortOrder: 6 },
            { name: 'إدارة الثغرات', score: 3, sortOrder: 7 },
          ],
        },

        recommendations: {
          create: [
            { title: 'تطبيق MFA على جميع الحسابات الإدارية', description: 'تفعيل المصادقة الثنائية فوراً لجميع الحسابات ذات الصلاحيات العالية.', priority: 'high', department: 'تقنية المعلومات', timeline: '30 يوماً', sortOrder: 0 },
            { title: 'إغلاق ثغرة RDP وتحديث الأنظمة', description: 'تطبيق التحديثات الأمنية وتقييد الوصول عبر RDP.', priority: 'high', department: 'البنية التحتية', timeline: '7 أيام', sortOrder: 1 },
          ],
        },
      },
      include: {
        decisions: { orderBy: { sortOrder: 'asc' } },
        risks: { orderBy: { sortOrder: 'asc' } },
        maturityDomains: { orderBy: { sortOrder: 'asc' } },
        recommendations: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'فشل في إنشاء التقرير' }, { status: 500 });
  }
}
