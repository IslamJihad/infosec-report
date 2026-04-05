import type { SPSDomain, SPSDomainResult, ScoreBreakdown } from '@/types/report';
import { DEFAULT_SPS_DOMAINS } from '@/lib/constants';

export type ScoreInput = {
  id?: string;
  spsDomains?: SPSDomain[] | null;
};

export interface ScoreResult {
  securityScore: number;
  scoreBreakdown: ScoreBreakdown;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/* ------------------------------------------------------------------ */
/*  Main scoring function — SPS v1                                     */
/* ------------------------------------------------------------------ */

export function calculateGlobalSecurityScore(input: ScoreInput): ScoreResult {
  const domains: SPSDomain[] =
    Array.isArray(input.spsDomains) && input.spsDomains.length > 0
      ? input.spsDomains
      : DEFAULT_SPS_DOMAINS;

  const domainResults: SPSDomainResult[] = [];
  const componentScores: Record<string, number> = {};
  const weightedContributions: Record<string, number> = {};

  let rawScore = 0;

  for (const domain of domains) {
    const subMetrics = Array.isArray(domain.subMetrics) ? domain.subMetrics : [];
    const totalWeight = subMetrics.reduce((s, sm) => s + toNumber(sm.weight, 0), 0);
    const usedDefault = subMetrics.length === 0 || totalWeight <= 0;

    const domainScore: number = usedDefault
      ? 50
      : clamp(
          subMetrics.reduce((s, sm) => s + clamp(toNumber(sm.value, 0), 0, 100) * toNumber(sm.weight, 0), 0) / totalWeight,
          0,
          100,
        );

    const domainWeight = toNumber(domain.weight, 0);
    const contribution = roundTo(domainScore * domainWeight);

    rawScore += domainScore * domainWeight;

    componentScores[domain.id] = roundTo(domainScore);
    weightedContributions[domain.id] = contribution;

    domainResults.push({
      id: domain.id,
      nameAr: domain.nameAr,
      nameEn: domain.nameEn,
      domainWeight,
      subMetricCount: subMetrics.length,
      domainScore: roundTo(domainScore),
      domainContribution: contribution,
      usedNeutralDefault: usedDefault,
    });
  }

  const finalScore = clamp(Math.round(rawScore), 0, 100);

  return {
    securityScore: finalScore,
    scoreBreakdown: {
      formulaVersion: 'sps-v1',
      equation: 'SPS = clamp(round(Σ(DomainScore × DomainWeight)), 0, 100)  |  DomainScore = Σ(subMetric × weight) / Σ(weights)',
      finalScore,
      rawScore: roundTo(rawScore),
      domainResults,
      componentScores,
      weightedContributions,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Percentile (unchanged)                                             */
/* ------------------------------------------------------------------ */

export function buildPercentileMap<T extends { id: string; securityScore: number }>(
  reports: T[],
): Record<string, number> {
  const map: Record<string, number> = {};
  if (reports.length === 0) return map;

  const scores = reports.map((r) => r.securityScore);
  const total = scores.length;

  for (const report of reports) {
    const below = scores.filter((s) => s < report.securityScore).length;
    const equal = scores.filter((s) => s === report.securityScore).length;
    const percentile = Math.round(((below + equal * 0.5) / total) * 100);
    map[report.id] = clamp(percentile, 0, 100);
  }

  return map;
}

export function getPercentileText(percentile: number): string {
  return `اعلى من ${percentile}% من التقارير`;
}
