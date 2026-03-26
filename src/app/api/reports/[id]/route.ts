import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        decisions: { orderBy: { sortOrder: 'asc' } },
        risks: { orderBy: { sortOrder: 'asc' } },
        maturityDomains: { orderBy: { sortOrder: 'asc' } },
        recommendations: { orderBy: { sortOrder: 'asc' } },
        assets: { orderBy: { sortOrder: 'asc' } },
        challenges: { orderBy: { sortOrder: 'asc' } },
        efficiencyKPIs: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!report) return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 });
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await req.json();

    // Separate nested relations from scalar fields
    const { decisions, risks, maturityDomains, recommendations, assets, challenges, efficiencyKPIs, id: _id, createdAt: _c, updatedAt: _u, ...scalarData } = data;

    // Stringify JSON-serialized array fields before writing to SQLite
    if (Array.isArray(scalarData.isoControls)) {
      scalarData.isoControls = JSON.stringify(scalarData.isoControls);
    }

    // Update scalar fields
    await prisma.report.update({
      where: { id },
      data: scalarData,
    });

    // Update decisions
    if (decisions) {
      await prisma.decision.deleteMany({ where: { reportId: id } });
      if (decisions.length > 0) {
        await prisma.decision.createMany({
          data: decisions.map((d: Record<string, unknown>, i: number) => ({
            id: (d.id as string)?.startsWith?.('new-') ? undefined : d.id,
            reportId: id,
            title: d.title || '',
            description: d.description || '',
            budget: d.budget || '',
            department: d.department || '',
            timeline: d.timeline || '',
            owner: d.owner || '',
            sortOrder: i,
          })),
        });
      }
    }

    // Update risks
    if (risks) {
      await prisma.risk.deleteMany({ where: { reportId: id } });
      if (risks.length > 0) {
        await prisma.risk.createMany({
          data: risks.map((r: Record<string, unknown>, i: number) => ({
            id: (r.id as string)?.startsWith?.('new-') ? undefined : r.id,
            reportId: id,
            description: r.description || '',
            system: r.system || '',
            severity: r.severity || 'medium',
            status: r.status || 'open',
            probability: r.probability || 3,
            impact: r.impact || 3,
            worstCase: r.worstCase || '',
            sortOrder: i,
          })),
        });
      }
    }

    // Update maturity domains
    if (maturityDomains) {
      await prisma.maturityDomain.deleteMany({ where: { reportId: id } });
      if (maturityDomains.length > 0) {
        await prisma.maturityDomain.createMany({
          data: maturityDomains.map((m: Record<string, unknown>, i: number) => ({
            id: (m.id as string)?.startsWith?.('new-') ? undefined : m.id,
            reportId: id,
            name: (typeof m.name === 'string' && m.name.trim()) ? m.name.trim() : `بند ${i + 1}`,
            score: (() => {
              const raw = Number(m.score);
              if (!Number.isFinite(raw)) return 0;
              if (raw > 0 && raw <= 5) return Math.round(raw * 20);
              return Math.max(0, Math.min(100, Math.round(raw)));
            })(),
            sortOrder: i,
          })),
        });
      }
    }

    // Update recommendations
    if (recommendations) {
      await prisma.recommendation.deleteMany({ where: { reportId: id } });
      if (recommendations.length > 0) {
        await prisma.recommendation.createMany({
          data: recommendations.map((r: Record<string, unknown>, i: number) => ({
            id: (r.id as string)?.startsWith?.('new-') ? undefined : r.id,
            reportId: id,
            title: r.title || '',
            description: r.description || '',
            priority: r.priority || 'medium',
            department: r.department || '',
            timeline: r.timeline || '',
            owner: r.owner || '',
            sortOrder: i,
          })),
        });
      }
    }

    // Update assets
    if (assets) {
      await prisma.asset.deleteMany({ where: { reportId: id } });
      if (assets.length > 0) {
        await prisma.asset.createMany({
          data: assets.map((a: Record<string, unknown>, i: number) => ({
            id: (a.id as string)?.startsWith?.('new-') ? undefined : a.id,
            reportId: id,
            name: a.name || '',
            value: a.value || '',
            protectionLevel: a.protectionLevel || 0,
            gaps: a.gaps || '',
            sortOrder: i,
          })),
        });
      }
    }

    // Update challenges
    if (challenges) {
      await prisma.challenge.deleteMany({ where: { reportId: id } });
      if (challenges.length > 0) {
        await prisma.challenge.createMany({
          data: challenges.map((c: Record<string, unknown>, i: number) => ({
            id: (c.id as string)?.startsWith?.('new-') ? undefined : c.id,
            reportId: id,
            title: c.title || '',
            type: c.type || 'budget',
            rootCause: c.rootCause || '',
            requirement: c.requirement || '',
            sortOrder: i,
          })),
        });
      }
    }

    // Update efficiency KPIs
    if (efficiencyKPIs) {
      await prisma.efficiencyKPI.deleteMany({ where: { reportId: id } });
      if (efficiencyKPIs.length > 0) {
        await prisma.efficiencyKPI.createMany({
          data: efficiencyKPIs.map((e: Record<string, unknown>, i: number) => ({
            id: (e.id as string)?.startsWith?.('new-') ? undefined : e.id,
            reportId: id,
            title: e.title || '',
            val: (e.val as number) || 0,
            target: (e.target as number) || 100,
            unit: (e.unit as string) || '%',
            description: e.description || '',
            lowerBetter: Boolean(e.lowerBetter),
            sortOrder: i,
          })),
        });
      }
    }

    // Return updated report
    const updated = await prisma.report.findUnique({
      where: { id },
      include: {
        decisions: { orderBy: { sortOrder: 'asc' } },
        risks: { orderBy: { sortOrder: 'asc' } },
        maturityDomains: { orderBy: { sortOrder: 'asc' } },
        recommendations: { orderBy: { sortOrder: 'asc' } },
        assets: { orderBy: { sortOrder: 'asc' } },
        challenges: { orderBy: { sortOrder: 'asc' } },
        efficiencyKPIs: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'فشل في حفظ التقرير' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.report.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'فشل في حذف التقرير' }, { status: 500 });
  }
}
