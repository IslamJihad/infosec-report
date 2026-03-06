import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const original = await prisma.report.findUnique({
      where: { id },
      include: {
        decisions: { orderBy: { sortOrder: 'asc' } },
        risks: { orderBy: { sortOrder: 'asc' } },
        maturityDomains: { orderBy: { sortOrder: 'asc' } },
        recommendations: { orderBy: { sortOrder: 'asc' } },
        assets: { orderBy: { sortOrder: 'asc' } },
        challenges: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!original) {
      return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 });
    }

    const { id: _id, createdAt: _c, updatedAt: _u, decisions, risks, maturityDomains, recommendations, assets, challenges, ...data } = original;

    const duplicate = await prisma.report.create({
      data: {
        ...data,
        title: `${data.title} (نسخة)`,
        status: 'draft',
        decisions: {
          create: decisions.map(({ id: _did, reportId: _rid, ...d }) => d),
        },
        risks: {
          create: risks.map(({ id: _rid2, reportId: _rid3, ...r }) => r),
        },
        maturityDomains: {
          create: maturityDomains.map(({ id: _mid, reportId: _rid4, ...m }) => m),
        },
        recommendations: {
          create: recommendations.map(({ id: _recid, reportId: _rid5, ...r }) => r),
        },
        assets: {
          create: assets.map(({ id: _aid, reportId: _rid6, ...a }) => a),
        },
        challenges: {
          create: challenges.map(({ id: _cid, reportId: _rid7, ...c }) => c),
        },
      },
      include: {
        decisions: { orderBy: { sortOrder: 'asc' } },
        risks: { orderBy: { sortOrder: 'asc' } },
        maturityDomains: { orderBy: { sortOrder: 'asc' } },
        recommendations: { orderBy: { sortOrder: 'asc' } },
        assets: { orderBy: { sortOrder: 'asc' } },
        challenges: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json(duplicate);
  } catch (error) {
    console.error('Error duplicating report:', error);
    return NextResponse.json({ error: 'فشل في نسخ التقرير' }, { status: 500 });
  }
}
