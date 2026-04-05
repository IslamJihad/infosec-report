import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { buildPercentileMap, calculateGlobalSecurityScore } from '@/lib/scoring';
import { DEFAULT_SPS_DOMAINS } from '@/lib/constants';
import type { SPSDomain } from '@/types/report';

function parseSPSDomains(json: string): SPSDomain[] {
  if (!json || json === '[]') return DEFAULT_SPS_DOMAINS;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as SPSDomain[]) : DEFAULT_SPS_DOMAINS;
  } catch {
    return DEFAULT_SPS_DOMAINS;
  }
}

const REPORT_INCLUDE = {
  decisions: { orderBy: { sortOrder: 'asc' as const } },
  risks: { orderBy: { sortOrder: 'asc' as const } },
  maturityDomains: { orderBy: { sortOrder: 'asc' as const } },
  recommendations: { orderBy: { sortOrder: 'asc' as const } },
  assets: { orderBy: { sortOrder: 'asc' as const } },
  challenges: { orderBy: { sortOrder: 'asc' as const } },
  efficiencyKPIs: { orderBy: { sortOrder: 'asc' as const } },
};

async function buildReportPercentiles(currentReportId: string, currentScore: number) {
  const allScores = await prisma.report.findMany({
    select: { id: true, securityScore: true },
  });

  const normalizedScores = allScores.map((entry) =>
    entry.id === currentReportId ? { ...entry, securityScore: currentScore } : entry,
  );

  return buildPercentileMap(normalizedScores);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const report = await prisma.report.findUnique({
      where: { id },
      include: REPORT_INCLUDE,
    });

    if (!report) return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 });

    const spsDomains = parseSPSDomains(report.spsDomainsJson);
    const scoreResult = calculateGlobalSecurityScore({ id: report.id, spsDomains });
    if (report.securityScore !== scoreResult.securityScore) {
      await prisma.report.update({
        where: { id },
        data: { securityScore: scoreResult.securityScore },
      });
    }

    const percentileMap = await buildReportPercentiles(id, scoreResult.securityScore);

    return NextResponse.json({
      ...report,
      spsDomains,
      securityScore: scoreResult.securityScore,
      scoreBreakdown: scoreResult.scoreBreakdown,
      scorePercentile: percentileMap[id] ?? 0,
    });
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
    const {
      decisions,
      risks,
      maturityDomains,
      recommendations,
      assets,
      challenges,
      efficiencyKPIs,
      spsDomains,
      ...scalarData
    } = data;

    delete scalarData.id;
    delete scalarData.createdAt;
    delete scalarData.updatedAt;
    delete scalarData.securityScore;
    delete scalarData.scoreBreakdown;
    delete scalarData.scorePercentile;

    // Stringify JSON-serialized array fields before writing to SQLite
    if (Array.isArray(scalarData.isoControls)) {
      scalarData.isoControls = JSON.stringify(scalarData.isoControls);
    }
    if (Array.isArray(spsDomains)) {
      scalarData.spsDomainsJson = JSON.stringify(spsDomains);
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
            severity: typeof r.severity === 'string' ? (r.severity.trim().toLowerCase() || 'medium') : 'medium',
            status: typeof r.status === 'string' ? (r.status.trim().toLowerCase() || 'open') : 'open',
            probability: r.probability || 3,
            impact: r.impact || 3,
            worstCase: r.worstCase || '',
            requiredControls: r.requiredControls || '',
            affectedAssets: r.affectedAssets || '',
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
      include: REPORT_INCLUDE,
    });

    if (!updated) {
      return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 });
    }

    const updatedSpsDomains = parseSPSDomains(updated.spsDomainsJson);
    const scoreResult = calculateGlobalSecurityScore({ id: updated.id, spsDomains: updatedSpsDomains });
    if (updated.securityScore !== scoreResult.securityScore) {
      await prisma.report.update({
        where: { id },
        data: { securityScore: scoreResult.securityScore },
      });
    }

    const percentileMap = await buildReportPercentiles(id, scoreResult.securityScore);

    return NextResponse.json({
      ...updated,
      spsDomains: updatedSpsDomains,
      securityScore: scoreResult.securityScore,
      scoreBreakdown: scoreResult.scoreBreakdown,
      scorePercentile: percentileMap[id] ?? 0,
    });
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
