import prisma from '@/lib/db';
import { ISO_27001_DOMAINS, SEVERITY_MAP, STATUS_MAP } from '@/lib/constants';
import type {
  AnalyticsGroupBy,
  AnalyticsGroupItem,
  AnalyticsInsight,
  AnalyticsIsoCoverage,
  AnalyticsQueryOptions,
  AnalyticsResponse,
  AnalyticsRiskDistribution,
  AnalyticsRiskSeverity,
  AnalyticsRiskStatus,
  AnalyticsTopRisk,
  AnalyticsTrendPoint,
} from '@/types/analytics';

interface IsoControlEntry {
  domainId?: string;
  currentApplied?: number;
}

export interface NormalizedAnalyticsQuery {
  from?: Date;
  to?: Date;
  limit: number;
  groupBy: AnalyticsGroupBy;
  riskSeverity?: AnalyticsRiskSeverity;
  riskStatus?: AnalyticsRiskStatus;
  reportId?: string;
}

function toSeverity(value: string): AnalyticsRiskSeverity {
  if (value === 'critical' || value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'medium';
}

function toRiskStatus(value: string): AnalyticsRiskStatus {
  if (value === 'open' || value === 'inprogress' || value === 'accepted' || value === 'closed') {
    return value;
  }
  return 'open';
}

function parseRiskSeverity(raw: unknown): AnalyticsRiskSeverity | undefined {
  if (raw === 'critical' || raw === 'high' || raw === 'medium' || raw === 'low') {
    return raw;
  }
  return undefined;
}

function parseRiskStatus(raw: unknown): AnalyticsRiskStatus | undefined {
  if (raw === 'open' || raw === 'inprogress' || raw === 'accepted' || raw === 'closed') {
    return raw;
  }
  return undefined;
}

function parseGroupBy(raw: unknown): AnalyticsGroupBy {
  if (raw === 'severity' || raw === 'status' || raw === 'system' || raw === 'organization') {
    return raw;
  }
  return 'none';
}

function parseIsoControls(rawIso: string): IsoControlEntry[] {
  try {
    const parsed = JSON.parse(rawIso);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeLimit(raw: unknown): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 24;
  return Math.max(1, Math.min(120, Math.trunc(parsed)));
}

function normalizeDate(raw: unknown): Date | undefined {
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeReportId(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed ? trimmed : undefined;
}

function roundTo(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function buildInsights(input: {
  totalReports: number;
  criticalRisks: number;
  openRisks: number;
  complianceDelta: number;
  overallIsoCoverage: number;
}): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];

  if (input.criticalRisks > 0) {
    insights.push({
      type: 'alert',
      title: 'تنبيه مخاطر حرجة',
      message: `يوجد ${input.criticalRisks} مخاطر حرجة ضمن ${input.openRisks} مخاطر مفتوحة. يوصى بالمعالجة الفورية لأعلى المخاطر.`,
    });
  } else {
    insights.push({
      type: 'success',
      title: 'استقرار جيد للمخاطر',
      message: 'لا توجد مخاطر حرجة حالياً، مع استمرار الحاجة لمتابعة المخاطر المفتوحة.',
    });
  }

  if (input.complianceDelta > 0) {
    insights.push({
      type: 'success',
      title: 'تحسن في الامتثال',
      message: `نسبة الامتثال ارتفعت بمقدار ${roundTo(input.complianceDelta)} نقطة مقارنة بالفترة السابقة.`,
    });
  } else if (input.complianceDelta < 0) {
    insights.push({
      type: 'alert',
      title: 'تراجع في الامتثال',
      message: `نسبة الامتثال انخفضت بمقدار ${roundTo(Math.abs(input.complianceDelta))} نقطة، ويستحسن مراجعة الضوابط الأقل تغطية.`,
    });
  } else {
    insights.push({
      type: 'info',
      title: 'امتثال مستقر',
      message: 'لا يوجد تغير ملحوظ في الامتثال عن الفترة السابقة.',
    });
  }

  if (input.totalReports === 0) {
    insights.push({
      type: 'info',
      title: 'لا توجد بيانات كافية',
      message: 'أنشئ تقارير إضافية للحصول على مؤشرات أدق للاتجاهات والأولويات.',
    });
  } else if (input.overallIsoCoverage < 60) {
    insights.push({
      type: 'alert',
      title: 'تغطية ISO تحتاج تعزيزاً',
      message: `التغطية الإجمالية الحالية ${roundTo(input.overallIsoCoverage)}%، ويستحسن استهداف المجالات الأقل تغطية أولاً.`,
    });
  } else {
    insights.push({
      type: 'info',
      title: 'تقدم في التغطية المعيارية',
      message: `التغطية الإجمالية الحالية ${roundTo(input.overallIsoCoverage)}% عبر مجالات ISO 27001.`,
    });
  }

  return insights.slice(0, 3);
}

export function normalizeAnalyticsQuery(input: Partial<AnalyticsQueryOptions> = {}): NormalizedAnalyticsQuery {
  return {
    from: normalizeDate(input.from),
    to: normalizeDate(input.to),
    limit: normalizeLimit(input.limit),
    groupBy: parseGroupBy(input.groupBy),
    riskSeverity: parseRiskSeverity(input.riskSeverity),
    riskStatus: parseRiskStatus(input.riskStatus),
    reportId: normalizeReportId(input.reportId),
  };
}

export function normalizedQueryToOptions(query: NormalizedAnalyticsQuery): AnalyticsQueryOptions {
  return {
    from: query.from ? query.from.toISOString().slice(0, 10) : undefined,
    to: query.to ? query.to.toISOString().slice(0, 10) : undefined,
    limit: query.limit,
    groupBy: query.groupBy,
    riskSeverity: query.riskSeverity,
    riskStatus: query.riskStatus,
    reportId: query.reportId,
  };
}

export async function getAnalyticsSnapshot(options: Partial<AnalyticsQueryOptions> = {}): Promise<AnalyticsResponse> {
  const normalized = normalizeAnalyticsQuery(options);
  return getAnalyticsSnapshotFromNormalized(normalized);
}

export async function getAnalyticsSnapshotFromNormalized(normalized: NormalizedAnalyticsQuery): Promise<AnalyticsResponse> {
  const createdAtFilter: { gte?: Date; lte?: Date } = {};
  if (normalized.from) createdAtFilter.gte = normalized.from;
  if (normalized.to) createdAtFilter.lte = normalized.to;

  const reportWhere: { createdAt?: { gte?: Date; lte?: Date }; id?: string } = {};
  if (normalized.from || normalized.to) reportWhere.createdAt = createdAtFilter;
  if (normalized.reportId) reportWhere.id = normalized.reportId;

  const reports = await prisma.report.findMany({
    where: Object.keys(reportWhere).length > 0 ? reportWhere : undefined,
    orderBy: { createdAt: 'desc' },
    take: normalized.limit,
    select: {
      id: true,
      orgName: true,
      createdAt: true,
      securityScore: true,
      kpiCompliance: true,
      prevCompliance: true,
      isoControls: true,
      risks: {
        select: {
          description: true,
          system: true,
          severity: true,
          status: true,
          probability: true,
          impact: true,
        },
      },
      maturityDomains: {
        select: {
          score: true,
        },
      },
    },
  });

  const orderedReports = [...reports].reverse();
  const reportCount = reports.length;
  const recentThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const riskSeverityCount: Record<AnalyticsRiskSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  let securitySum = 0;
  let complianceSum = 0;
  let prevComplianceSum = 0;
  let totalRisks = 0;
  let openRisks = 0;
  let closedRisks = 0;
  let criticalRisks = 0;
  let recentRiskSignals = 0;
  let maturityScoreSum = 0;
  let maturityItemsCount = 0;

  const isoByDomain = new Map<string, { domainName: string; applied: number; total: number }>();
  ISO_27001_DOMAINS.forEach((domain) => {
    isoByDomain.set(domain.id, {
      domainName: domain.name,
      applied: 0,
      total: domain.total * reportCount,
    });
  });

  const topRiskBuffer: AnalyticsTopRisk[] = [];
  const trend: AnalyticsTrendPoint[] = [];
  const groupedAccumulator = new Map<string, { label: string; count: number; openCount: number; scoreSum: number }>();

  orderedReports.forEach((report) => {
    securitySum += report.securityScore;
    complianceSum += report.kpiCompliance;
    prevComplianceSum += report.prevCompliance;

    const parsedIso = parseIsoControls(report.isoControls);
    const appliedByDomain = new Map<string, number>();
    parsedIso.forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      if (!entry.domainId || typeof entry.domainId !== 'string') return;
      const applied = Number(entry.currentApplied ?? 0);
      if (!Number.isFinite(applied)) return;
      appliedByDomain.set(entry.domainId, Math.max(0, Math.trunc(applied)));
    });

    ISO_27001_DOMAINS.forEach((domain) => {
      const domainAggregate = isoByDomain.get(domain.id);
      if (!domainAggregate) return;
      const applied = Math.min(domain.total, appliedByDomain.get(domain.id) ?? 0);
      domainAggregate.applied += applied;
    });

    report.maturityDomains.forEach((domain) => {
      maturityScoreSum += domain.score;
      maturityItemsCount += 1;
    });

    let reportRiskCount = 0;

    report.risks.forEach((risk) => {
      const severity = toSeverity(risk.severity);
      const status = toRiskStatus(risk.status);

      if (normalized.riskSeverity && severity !== normalized.riskSeverity) return;
      if (normalized.riskStatus && status !== normalized.riskStatus) return;

      const score = risk.probability * risk.impact;
      const system = risk.system?.trim() || 'غير محدد';

      riskSeverityCount[severity] += 1;
      totalRisks += 1;
      reportRiskCount += 1;

      if (status !== 'closed') {
        openRisks += 1;
      } else {
        closedRisks += 1;
      }

      if (severity === 'critical') criticalRisks += 1;
      if (report.createdAt >= recentThreshold) recentRiskSignals += 1;

      if (normalized.groupBy !== 'none') {
        let key = '';
        let label = '';
        if (normalized.groupBy === 'severity') {
          key = severity;
          label = SEVERITY_MAP[severity].label;
        } else if (normalized.groupBy === 'status') {
          key = status;
          label = STATUS_MAP[status].label;
        } else if (normalized.groupBy === 'system') {
          key = system;
          label = system;
        } else {
          key = report.orgName;
          label = report.orgName;
        }

        const previous = groupedAccumulator.get(key);
        groupedAccumulator.set(key, {
          label,
          count: (previous?.count ?? 0) + 1,
          openCount: (previous?.openCount ?? 0) + (status !== 'closed' ? 1 : 0),
          scoreSum: (previous?.scoreSum ?? 0) + score,
        });
      }

      topRiskBuffer.push({
        reportId: report.id,
        reportName: report.orgName,
        system,
        description: risk.description,
        severity,
        status,
        score,
      });
    });

    trend.push({
      reportId: report.id,
      orgName: report.orgName,
      date: report.createdAt.toISOString(),
      securityScore: report.securityScore,
      compliance: report.kpiCompliance,
      riskCount: reportRiskCount,
    });
  });

  const riskDistribution: AnalyticsRiskDistribution[] = [
    { severity: 'critical', count: riskSeverityCount.critical },
    { severity: 'high', count: riskSeverityCount.high },
    { severity: 'medium', count: riskSeverityCount.medium },
    { severity: 'low', count: riskSeverityCount.low },
  ];

  const topRisks = topRiskBuffer
    .sort((a, b) => b.score - a.score || Number(a.status === 'closed') - Number(b.status === 'closed'))
    .slice(0, 10);

  const groupedItems: AnalyticsGroupItem[] = [...groupedAccumulator.entries()]
    .map(([key, value]) => ({
      key,
      label: value.label,
      count: value.count,
      openCount: value.openCount,
      avgScore: value.count > 0 ? roundTo(value.scoreSum / value.count) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const isoCoverage: AnalyticsIsoCoverage[] = ISO_27001_DOMAINS.map((domain) => {
    const aggregate = isoByDomain.get(domain.id);
    const applied = aggregate?.applied ?? 0;
    const total = aggregate?.total ?? 0;
    return {
      domainId: domain.id,
      domainName: domain.name,
      applied,
      total,
      coverage: total > 0 ? roundTo((applied / total) * 100, 1) : 0,
    };
  });

  const isoAppliedTotal = isoCoverage.reduce((acc, item) => acc + item.applied, 0);
  const isoPossibleTotal = isoCoverage.reduce((acc, item) => acc + item.total, 0);
  const overallIsoCoverage = isoPossibleTotal > 0 ? roundTo((isoAppliedTotal / isoPossibleTotal) * 100, 1) : 0;

  const avgCompliance = reportCount > 0 ? roundTo(complianceSum / reportCount) : 0;
  const avgPrevCompliance = reportCount > 0 ? roundTo(prevComplianceSum / reportCount) : 0;
  const complianceDelta = reportCount > 0 ? roundTo(avgCompliance - avgPrevCompliance) : 0;

  return {
    summary: {
      totalReports: reportCount,
      avgSecurityScore: reportCount > 0 ? roundTo(securitySum / reportCount) : 0,
      avgCompliance,
      avgPrevCompliance,
      complianceDelta,
      totalRisks,
      openRisks,
      criticalRisks,
      avgMaturityScore: maturityItemsCount > 0 ? roundTo(maturityScoreSum / maturityItemsCount) : 0,
    },
    insights: buildInsights({
      totalReports: reportCount,
      criticalRisks,
      openRisks,
      complianceDelta,
      overallIsoCoverage,
    }),
    velocity: {
      recentRiskSignals,
      activeRisks: openRisks,
      closedRisks,
      closureRate: totalRisks > 0 ? roundTo((closedRisks / totalRisks) * 100, 1) : 0,
      criticalExposure: totalRisks > 0 ? roundTo((criticalRisks / totalRisks) * 100, 1) : 0,
    },
    trend,
    riskDistribution,
    topRisks,
    grouped: {
      dimension: normalized.groupBy,
      items: groupedItems,
    },
    isoCoverage,
    overallIsoCoverage,
  };
}
