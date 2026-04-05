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

const REPORT_STRING_FIELDS = [
  'title',
  'orgName',
  'subject',
  'recipientName',
  'period',
  'issueDate',
  'version',
  'author',
  'classification',
  'logoBase64',
  'summary',
  'securityLevel',
  'trend',
  'status',
  'chairNote',
  'bmSector',
] as const;

const REPORT_INT_FIELDS = [
  'kpiCritical',
  'kpiVuln',
  'kpiTotal',
  'kpiCompliance',
  'prevCritical',
  'prevVuln',
  'prevTotal',
  'prevCompliance',
  'vulnCritical',
  'vulnHigh',
  'vulnMedium',
  'vulnLow',
  'incOpen',
  'incProgress',
  'incClosed',
  'incWatch',
  'slaBreach',
  'vulnResolved',
  'vulnRecurring',
  'bmScore',
  'bmCompliance',
] as const;

const REPORT_FLOAT_FIELDS = ['slaMTTC', 'slaMTTCTarget', 'slaRate'] as const;
const REPORT_BOOLEAN_FIELDS = ['showSLA', 'showMaturity'] as const;

function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  return String(value);
}

function toIntValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function toFloatValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBooleanValue(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pickPersistedId(item: Record<string, unknown>): string | undefined {
  const id = typeof item.id === 'string' ? item.id.trim() : '';
  const reportId = typeof item.reportId === 'string' ? item.reportId.trim() : '';
  if (!id || id.startsWith('new-') || !reportId) return undefined;
  return id;
}

function sanitizeReportScalarData(
  scalarData: Record<string, unknown>,
  spsDomains: unknown,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const field of REPORT_STRING_FIELDS) {
    const value = scalarData[field];
    if (value !== undefined) {
      normalized[field] = toStringValue(value);
    }
  }

  for (const field of REPORT_INT_FIELDS) {
    const value = scalarData[field];
    if (value !== undefined) {
      normalized[field] = toIntValue(value, 0);
    }
  }

  for (const field of REPORT_FLOAT_FIELDS) {
    const value = scalarData[field];
    if (value !== undefined) {
      normalized[field] = toFloatValue(value, 0);
    }
  }

  for (const field of REPORT_BOOLEAN_FIELDS) {
    const value = scalarData[field];
    if (value !== undefined) {
      normalized[field] = toBooleanValue(value, false);
    }
  }

  const isoControls = scalarData.isoControls;
  if (Array.isArray(isoControls)) {
    normalized.isoControls = JSON.stringify(isoControls);
  } else if (typeof isoControls === 'string') {
    normalized.isoControls = isoControls;
  }

  if (Array.isArray(spsDomains)) {
    normalized.spsDomainsJson = JSON.stringify(spsDomains);
  } else if (typeof scalarData.spsDomainsJson === 'string') {
    normalized.spsDomainsJson = scalarData.spsDomainsJson;
  }

  return normalized;
}

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
    const data = await req.json() as Record<string, unknown>;

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

    const exists = await prisma.report.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 });
    }

    const normalizedScalarData = sanitizeReportScalarData(scalarData, spsDomains);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.report.update({
        where: { id },
        data: normalizedScalarData,
      });

      // Update decisions
      if (Array.isArray(decisions)) {
        await tx.decision.deleteMany({ where: { reportId: id } });
        if (decisions.length > 0) {
          await tx.decision.createMany({
            data: decisions.map((d, i) => {
              const item = d as Record<string, unknown>;
              return {
                id: pickPersistedId(item),
                reportId: id,
                title: toStringValue(item.title),
                description: toStringValue(item.description),
                budget: toStringValue(item.budget),
                department: toStringValue(item.department),
                timeline: toStringValue(item.timeline),
                owner: toStringValue(item.owner),
                sortOrder: i,
              };
            }),
          });
        }
      }

      // Update risks
      if (Array.isArray(risks)) {
        await tx.risk.deleteMany({ where: { reportId: id } });
        if (risks.length > 0) {
          await tx.risk.createMany({
            data: risks.map((r, i) => {
              const item = r as Record<string, unknown>;
              return {
                id: pickPersistedId(item),
                reportId: id,
                description: toStringValue(item.description),
                system: toStringValue(item.system),
                severity: toStringValue(item.severity, 'medium').trim().toLowerCase() || 'medium',
                status: toStringValue(item.status, 'open').trim().toLowerCase() || 'open',
                probability: clamp(toIntValue(item.probability, 3), 1, 5),
                impact: clamp(toIntValue(item.impact, 3), 1, 5),
                worstCase: toStringValue(item.worstCase),
                requiredControls: toStringValue(item.requiredControls),
                affectedAssets: toStringValue(item.affectedAssets),
                sortOrder: i,
              };
            }),
          });
        }
      }

      // Update maturity domains
      if (Array.isArray(maturityDomains)) {
        await tx.maturityDomain.deleteMany({ where: { reportId: id } });
        if (maturityDomains.length > 0) {
          await tx.maturityDomain.createMany({
            data: maturityDomains.map((m, i) => {
              const item = m as Record<string, unknown>;
              const rawScore = toFloatValue(item.score, 0);
              const score = rawScore > 0 && rawScore <= 5
                ? Math.round(rawScore * 20)
                : clamp(Math.round(rawScore), 0, 100);

              return {
                id: pickPersistedId(item),
                reportId: id,
                name: toStringValue(item.name, `بند ${i + 1}`).trim() || `بند ${i + 1}`,
                score,
                sortOrder: i,
              };
            }),
          });
        }
      }

      // Update recommendations
      if (Array.isArray(recommendations)) {
        await tx.recommendation.deleteMany({ where: { reportId: id } });
        if (recommendations.length > 0) {
          await tx.recommendation.createMany({
            data: recommendations.map((r, i) => {
              const item = r as Record<string, unknown>;
              return {
                id: pickPersistedId(item),
                reportId: id,
                title: toStringValue(item.title),
                description: toStringValue(item.description),
                priority: toStringValue(item.priority, 'medium').trim().toLowerCase() || 'medium',
                department: toStringValue(item.department),
                timeline: toStringValue(item.timeline),
                owner: toStringValue(item.owner),
                sortOrder: i,
              };
            }),
          });
        }
      }

      // Update assets
      if (Array.isArray(assets)) {
        await tx.asset.deleteMany({ where: { reportId: id } });
        if (assets.length > 0) {
          await tx.asset.createMany({
            data: assets.map((a, i) => {
              const item = a as Record<string, unknown>;
              return {
                id: pickPersistedId(item),
                reportId: id,
                name: toStringValue(item.name),
                value: toStringValue(item.value),
                protectionLevel: clamp(toIntValue(item.protectionLevel, 0), 0, 100),
                gaps: toStringValue(item.gaps),
                sortOrder: i,
              };
            }),
          });
        }
      }

      // Update challenges
      if (Array.isArray(challenges)) {
        await tx.challenge.deleteMany({ where: { reportId: id } });
        if (challenges.length > 0) {
          await tx.challenge.createMany({
            data: challenges.map((c, i) => {
              const item = c as Record<string, unknown>;
              return {
                id: pickPersistedId(item),
                reportId: id,
                title: toStringValue(item.title),
                type: toStringValue(item.type, 'budget').trim().toLowerCase() || 'budget',
                rootCause: toStringValue(item.rootCause),
                requirement: toStringValue(item.requirement),
                sortOrder: i,
              };
            }),
          });
        }
      }

      // Update efficiency KPIs
      if (Array.isArray(efficiencyKPIs)) {
        await tx.efficiencyKPI.deleteMany({ where: { reportId: id } });
        if (efficiencyKPIs.length > 0) {
          await tx.efficiencyKPI.createMany({
            data: efficiencyKPIs.map((e, i) => {
              const item = e as Record<string, unknown>;
              return {
                id: pickPersistedId(item),
                reportId: id,
                title: toStringValue(item.title),
                val: toFloatValue(item.val, 0),
                target: toFloatValue(item.target, 100),
                unit: toStringValue(item.unit, '%') || '%',
                description: toStringValue(item.description),
                lowerBetter: toBooleanValue(item.lowerBetter, false),
                sortOrder: i,
              };
            }),
          });
        }
      }

      return tx.report.findUnique({
        where: { id },
        include: REPORT_INCLUDE,
      });
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
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'فشل في حفظ التقرير', detail }, { status: 500 });
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
