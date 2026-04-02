type RiskLike = {
  status?: string | null;
  probability?: number | null;
  impact?: number | null;
};

type MaturityLike = {
  score?: number | null;
};

type AssetLike = {
  protectionLevel?: number | null;
};

type EfficiencyLike = {
  val?: number | null;
  target?: number | null;
  lowerBetter?: boolean | null;
};

export type ScoreInput = {
  id?: string;
  securityScore?: number | null;
  kpiCompliance?: number | null;
  risks?: RiskLike[] | null;
  maturityDomains?: MaturityLike[] | null;
  assets?: AssetLike[] | null;
  efficiencyKPIs?: EfficiencyLike[] | null;
  slaMTTC?: number | null;
  slaMTTCTarget?: number | null;
};

export interface ScoreBreakdown {
  formulaVersion: 'v1';
  equation: string;
  components: {
    kpiCompliance: number;
    avgMaturity: number;
    avgAssetProtection: number;
    criticalRisks: number;
    openRisks: number;
    totalRisks: number;
    avgEfficiencyAchievement: number;
    slaMTTC: number;
    slaMTTCTarget: number;
  };
  governanceBase: number;
  riskPenalty: number;
  efficiencyBonus: number;
  slaPenalty: number;
  rawScore: number;
  finalScore: number;
}

export interface ScoreResult {
  securityScore: number;
  scoreBreakdown: ScoreBreakdown;
}

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

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeEfficiencyKPI(kpi: EfficiencyLike): number {
  const target = Math.max(0, toNumber(kpi.target, 0));
  const val = Math.max(0, toNumber(kpi.val, 0));
  const lowerBetter = Boolean(kpi.lowerBetter);

  if (target <= 0) return 0;

  if (lowerBetter) {
    if (val === 0) return 100;
    return clamp((target / val) * 100, 0, 100);
  }

  return clamp((val / target) * 100, 0, 100);
}

export function calculateGlobalSecurityScore(input: ScoreInput): ScoreResult {
  const kpiCompliance = clamp(toNumber(input.kpiCompliance, 0), 0, 100);
  const avgMaturity = clamp(
    average((input.maturityDomains ?? []).map((domain) => clamp(toNumber(domain.score, 0), 0, 100))),
    0,
    100,
  );
  const avgAssetProtection = clamp(
    average((input.assets ?? []).map((asset) => clamp(toNumber(asset.protectionLevel, 0), 0, 100))),
    0,
    100,
  );

  const risks = input.risks ?? [];
  const totalRisks = risks.length;
  const criticalRisks = risks.filter((risk) => toNumber(risk.probability, 0) * toNumber(risk.impact, 0) >= 15).length;
  const openRisks = risks.filter((risk) => (risk.status ?? '').toLowerCase() !== 'closed').length;

  const avgEfficiencyAchievement = clamp(
    average((input.efficiencyKPIs ?? []).map(normalizeEfficiencyKPI)),
    0,
    100,
  );

  const slaMTTC = Math.max(0, toNumber(input.slaMTTC, 0));
  const slaMTTCTarget = Math.max(1, toNumber(input.slaMTTCTarget, 24));

  const governanceBase =
    (kpiCompliance * 0.4) +
    (avgMaturity * 0.35) +
    (avgAssetProtection * 0.25);

  const riskPenalty = Math.min(
    40,
    ((criticalRisks / Math.max(totalRisks, 1)) * 30) +
      ((openRisks / Math.max(totalRisks, 1)) * 10),
  );

  const efficiencyBonus = Math.min(10, avgEfficiencyAchievement * 0.1);

  const slaPenalty =
    slaMTTC <= slaMTTCTarget
      ? 0
      : Math.min(15, ((slaMTTC - slaMTTCTarget) / Math.max(slaMTTCTarget, 1)) * 15);

  const rawScore = governanceBase - riskPenalty + efficiencyBonus - slaPenalty;
  const finalScore = clamp(Math.round(rawScore), 0, 100);

  return {
    securityScore: finalScore,
    scoreBreakdown: {
      formulaVersion: 'v1',
      equation:
        'Score = clamp(round((0.40*Compliance + 0.35*AvgMaturity + 0.25*AvgAssetProtection) - RiskPenalty + EfficiencyBonus - SlaPenalty), 0, 100)',
      components: {
        kpiCompliance: roundTo(kpiCompliance),
        avgMaturity: roundTo(avgMaturity),
        avgAssetProtection: roundTo(avgAssetProtection),
        criticalRisks,
        openRisks,
        totalRisks,
        avgEfficiencyAchievement: roundTo(avgEfficiencyAchievement),
        slaMTTC: roundTo(slaMTTC),
        slaMTTCTarget: roundTo(slaMTTCTarget),
      },
      governanceBase: roundTo(governanceBase),
      riskPenalty: roundTo(riskPenalty),
      efficiencyBonus: roundTo(efficiencyBonus),
      slaPenalty: roundTo(slaPenalty),
      rawScore: roundTo(rawScore),
      finalScore,
    },
  };
}

export function buildPercentileMap<T extends { id: string; securityScore: number }>(
  reports: T[],
): Record<string, number> {
  const map: Record<string, number> = {};
  if (reports.length === 0) return map;

  const scores = reports.map((report) => report.securityScore);
  const total = scores.length;

  for (const report of reports) {
    const below = scores.filter((score) => score < report.securityScore).length;
    const equal = scores.filter((score) => score === report.securityScore).length;
    const percentile = Math.round(((below + (equal * 0.5)) / total) * 100);
    map[report.id] = clamp(percentile, 0, 100);
  }

  return map;
}

export function getPercentileText(percentile: number): string {
  return `اعلى من ${percentile}% من التقارير`;
}
