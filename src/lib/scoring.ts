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
  id?: string | null;
  title?: string | null;
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
  governanceDetails: {
    complianceWeighted: number;
    maturityWeighted: number;
    assetProtectionWeighted: number;
    beforeRounding: number;
  };
  riskPenaltyDetails: {
    criticalThreshold: number;
    denominator: number;
    criticalRatio: number;
    openRatio: number;
    criticalContribution: number;
    openContribution: number;
    beforeCap: number;
    capValue: number;
    capApplied: boolean;
  };
  efficiencyBonusDetails: {
    kpiCount: number;
    normalizedKpis: Array<{
      id: string;
      title: string;
      actual: number;
      target: number;
      lowerBetter: boolean;
      normalized: number;
    }>;
    multiplier: number;
    beforeCap: number;
    capValue: number;
    capApplied: boolean;
  };
  slaPenaltyDetails: {
    wasTriggered: boolean;
    defaultTargetApplied: boolean;
    deltaOverTarget: number;
    overflowRatio: number;
    beforeCap: number;
    capValue: number;
    capApplied: boolean;
  };
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

function normalizeMaturityScore(value: unknown): number {
  const parsed = toNumber(value, 0);
  // Backward compatibility: some legacy reports still store maturity on a 1..5 scale.
  if (parsed > 0 && parsed <= 5) return clamp(parsed * 20, 0, 100);
  return clamp(parsed, 0, 100);
}

function normalizeEfficiencyKPI(kpi: EfficiencyLike) {
  const target = Math.max(0, toNumber(kpi.target, 0));
  const val = Math.max(0, toNumber(kpi.val, 0));
  const lowerBetter = Boolean(kpi.lowerBetter);

  if (target <= 0) {
    return {
      id: String(kpi.id ?? ''),
      title: typeof kpi.title === 'string' && kpi.title.trim() ? kpi.title.trim() : 'KPI',
      actual: val,
      target,
      lowerBetter,
      normalized: 0,
    };
  }

  const normalized = lowerBetter
    ? (val === 0 ? 100 : clamp((target / val) * 100, 0, 100))
    : clamp((val / target) * 100, 0, 100);

  return {
    id: String(kpi.id ?? ''),
    title: typeof kpi.title === 'string' && kpi.title.trim() ? kpi.title.trim() : 'KPI',
    actual: val,
    target,
    lowerBetter,
    normalized,
  };
}

export function calculateGlobalSecurityScore(input: ScoreInput): ScoreResult {
  const kpiCompliance = clamp(toNumber(input.kpiCompliance, 0), 0, 100);
  const avgMaturity = clamp(
    average((input.maturityDomains ?? []).map((domain) => normalizeMaturityScore(domain.score))),
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
  const criticalThreshold = 15;
  const criticalRisks = risks.filter((risk) => toNumber(risk.probability, 0) * toNumber(risk.impact, 0) >= criticalThreshold).length;
  const openRisks = risks.filter((risk) => (risk.status ?? '').toLowerCase() !== 'closed').length;
  const riskDenominator = Math.max(totalRisks, 1);

  const normalizedKpis = (input.efficiencyKPIs ?? []).map(normalizeEfficiencyKPI);

  const avgEfficiencyAchievement = clamp(
    average(normalizedKpis.map((kpi) => kpi.normalized)),
    0,
    100,
  );

  const slaMTTC = Math.max(0, toNumber(input.slaMTTC, 0));
  const targetInputParsed = Number(input.slaMTTCTarget);
  const defaultTargetApplied = !Number.isFinite(targetInputParsed);
  const slaMTTCTarget = Math.max(1, defaultTargetApplied ? 24 : targetInputParsed);

  const complianceWeighted = kpiCompliance * 0.4;
  const maturityWeighted = avgMaturity * 0.35;
  const assetProtectionWeighted = avgAssetProtection * 0.25;

  const governanceBase = complianceWeighted + maturityWeighted + assetProtectionWeighted;

  const criticalContribution = (criticalRisks / riskDenominator) * 30;
  const openContribution = (openRisks / riskDenominator) * 10;
  const riskPenaltyBeforeCap = criticalContribution + openContribution;

  const riskPenaltyCap = 40;
  const riskPenalty = Math.min(riskPenaltyCap, riskPenaltyBeforeCap);
  const riskPenaltyCapApplied = riskPenaltyBeforeCap > riskPenaltyCap;

  const efficiencyMultiplier = 0.1;
  const efficiencyBonusCap = 10;
  const efficiencyBonusBeforeCap = avgEfficiencyAchievement * efficiencyMultiplier;
  const efficiencyBonus = Math.min(efficiencyBonusCap, efficiencyBonusBeforeCap);
  const efficiencyBonusCapApplied = efficiencyBonusBeforeCap > efficiencyBonusCap;

  const slaPenaltyCap = 15;
  const slaDeltaOverTarget = Math.max(0, slaMTTC - slaMTTCTarget);
  const slaOverflowRatio = slaDeltaOverTarget > 0
    ? slaDeltaOverTarget / Math.max(slaMTTCTarget, 1)
    : 0;
  const slaPenaltyBeforeCap = slaOverflowRatio * slaPenaltyCap;
  const slaPenaltyCapApplied = slaPenaltyBeforeCap > slaPenaltyCap;

  const slaPenalty =
    slaMTTC <= slaMTTCTarget
      ? 0
      : Math.min(slaPenaltyCap, slaPenaltyBeforeCap);

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
      governanceDetails: {
        complianceWeighted: roundTo(complianceWeighted),
        maturityWeighted: roundTo(maturityWeighted),
        assetProtectionWeighted: roundTo(assetProtectionWeighted),
        beforeRounding: roundTo(governanceBase),
      },
      riskPenaltyDetails: {
        criticalThreshold,
        denominator: riskDenominator,
        criticalRatio: roundTo(criticalRisks / riskDenominator, 3),
        openRatio: roundTo(openRisks / riskDenominator, 3),
        criticalContribution: roundTo(criticalContribution),
        openContribution: roundTo(openContribution),
        beforeCap: roundTo(riskPenaltyBeforeCap),
        capValue: riskPenaltyCap,
        capApplied: riskPenaltyCapApplied,
      },
      efficiencyBonusDetails: {
        kpiCount: normalizedKpis.length,
        normalizedKpis: normalizedKpis.map((kpi) => ({
          id: kpi.id,
          title: kpi.title,
          actual: roundTo(kpi.actual, 2),
          target: roundTo(kpi.target, 2),
          lowerBetter: kpi.lowerBetter,
          normalized: roundTo(kpi.normalized),
        })),
        multiplier: efficiencyMultiplier,
        beforeCap: roundTo(efficiencyBonusBeforeCap),
        capValue: efficiencyBonusCap,
        capApplied: efficiencyBonusCapApplied,
      },
      slaPenaltyDetails: {
        wasTriggered: slaMTTC > slaMTTCTarget,
        defaultTargetApplied,
        deltaOverTarget: roundTo(slaDeltaOverTarget, 2),
        overflowRatio: roundTo(slaOverflowRatio, 3),
        beforeCap: roundTo(slaPenaltyBeforeCap),
        capValue: slaPenaltyCap,
        capApplied: slaPenaltyCapApplied,
      },
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
