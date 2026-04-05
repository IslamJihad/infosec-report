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

export type RiskSeverityBand = 'critical' | 'high' | 'medium' | 'low';

export interface RiskDeductionRecord {
  index: number;
  probability: number;
  impact: number;
  riskScore: number;
  band: RiskSeverityBand;
  status: string;
  deduction: number;
}

export interface NormalizedKpiRecord {
  id: string;
  title: string;
  actual: number;
  target: number;
  lowerBetter: boolean;
  normalized: number;
}

export interface ScoreBreakdown {
  formulaVersion: 'v2';
  equation: string;
  finalScore: number;
  rawScore: number;

  weights: {
    compliance: number;
    maturity: number;
    assetProtection: number;
    riskPosture: number;
    operational: number;
  };

  complianceDetails: {
    inputValue: number;
    score: number;
  };

  maturityDetails: {
    domainCount: number;
    normalizedScores: number[];
    usedNeutralDefault: boolean;
    score: number;
  };

  assetProtectionDetails: {
    assetCount: number;
    protectionLevels: number[];
    usedNeutralDefault: boolean;
    score: number;
  };

  riskPostureDetails: {
    totalRisks: number;
    openRisks: number;
    inProgressRisks: number;
    closedRisks: number;
    totalDeduction: number;
    perRiskDeductions: RiskDeductionRecord[];
    score: number;
  };

  operationalDetails: {
    kpiAchievement: number;
    kpiCount: number;
    normalizedKpis: NormalizedKpiRecord[];
    kpiUsedNeutralDefault: boolean;
    slaCompliance: number;
    slaMTTC: number;
    slaMTTCTarget: number;
    slaUsedNeutralDefault: boolean;
    score: number;
  };

  componentScores: {
    compliance: number;
    maturity: number;
    assetProtection: number;
    riskPosture: number;
    operational: number;
  };

  weightedContributions: {
    compliance: number;
    maturity: number;
    assetProtection: number;
    riskPosture: number;
    operational: number;
  };
}

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

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const NEUTRAL_DEFAULT = 50;

/* ------------------------------------------------------------------ */
/*  Maturity normalization (v2: 1→0, 5→100)                           */
/* ------------------------------------------------------------------ */

function normalizeMaturityScore(value: unknown): number {
  const parsed = toNumber(value, 0);
  if (parsed >= 1 && parsed <= 5) return clamp(((parsed - 1) / 4) * 100, 0, 100);
  return clamp(parsed, 0, 100);
}

/* ------------------------------------------------------------------ */
/*  Risk severity band & deduction                                     */
/* ------------------------------------------------------------------ */

const RISK_DEDUCTIONS: Record<RiskSeverityBand, { open: number; inprogress: number }> = {
  critical: { open: 25, inprogress: 12 },
  high: { open: 15, inprogress: 7 },
  medium: { open: 8, inprogress: 4 },
  low: { open: 3, inprogress: 1.5 },
};

function getRiskBand(riskScore: number): RiskSeverityBand {
  if (riskScore >= 15) return 'critical';
  if (riskScore >= 10) return 'high';
  if (riskScore >= 5) return 'medium';
  return 'low';
}

function getRiskDeduction(band: RiskSeverityBand, status: string): number {
  const normalizedStatus = (status ?? '').toLowerCase().trim();
  if (normalizedStatus === 'closed') return 0;
  if (normalizedStatus === 'inprogress') return RISK_DEDUCTIONS[band].inprogress;
  return RISK_DEDUCTIONS[band].open;
}

/* ------------------------------------------------------------------ */
/*  Efficiency KPI normalization (unchanged logic)                     */
/* ------------------------------------------------------------------ */

function normalizeEfficiencyKPI(kpi: EfficiencyLike): NormalizedKpiRecord {
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

/* ------------------------------------------------------------------ */
/*  Main scoring function                                              */
/* ------------------------------------------------------------------ */

export function calculateGlobalSecurityScore(input: ScoreInput): ScoreResult {
  // --- Component 1: Compliance (25%) ---
  const complianceInput = clamp(toNumber(input.kpiCompliance, 0), 0, 100);
  const complianceScore = complianceInput;

  // --- Component 2: Maturity (20%) ---
  const maturityDomains = input.maturityDomains ?? [];
  const normalizedMaturityScores = maturityDomains.map((d) => normalizeMaturityScore(d.score));
  const maturityUsedDefault = normalizedMaturityScores.length === 0;
  const maturityScore = maturityUsedDefault ? NEUTRAL_DEFAULT : clamp(average(normalizedMaturityScores), 0, 100);

  // --- Component 3: Asset Protection (15%) ---
  const assets = input.assets ?? [];
  const protectionLevels = assets.map((a) => clamp(toNumber(a.protectionLevel, 0), 0, 100));
  const assetUsedDefault = protectionLevels.length === 0;
  const assetProtectionScore = assetUsedDefault ? NEUTRAL_DEFAULT : clamp(average(protectionLevels), 0, 100);

  // --- Component 4: Risk Posture (25%) ---
  const risks = input.risks ?? [];
  let totalDeduction = 0;
  let openCount = 0;
  let inProgressCount = 0;
  let closedCount = 0;
  const perRiskDeductions: RiskDeductionRecord[] = [];

  risks.forEach((risk, index) => {
    const prob = toNumber(risk.probability, 0);
    const imp = toNumber(risk.impact, 0);
    const riskScore = prob * imp;
    const band = getRiskBand(riskScore);
    const status = (risk.status ?? 'open').toLowerCase().trim();
    const deduction = getRiskDeduction(band, status);

    if (status === 'closed') closedCount++;
    else if (status === 'inprogress') inProgressCount++;
    else openCount++;

    totalDeduction += deduction;
    perRiskDeductions.push({
      index,
      probability: prob,
      impact: imp,
      riskScore,
      band,
      status,
      deduction,
    });
  });

  const riskPostureScore = risks.length === 0 ? 100 : clamp(Math.max(0, 100 - totalDeduction), 0, 100);

  // --- Component 5: Operational (15%) ---
  const normalizedKpis = (input.efficiencyKPIs ?? []).map(normalizeEfficiencyKPI);
  const kpiUsedDefault = normalizedKpis.length === 0;
  const kpiAchievement = kpiUsedDefault ? NEUTRAL_DEFAULT : clamp(average(normalizedKpis.map((k) => k.normalized)), 0, 100);

  const slaMTTC = Math.max(0, toNumber(input.slaMTTC, 0));
  const targetInputParsed = Number(input.slaMTTCTarget);
  const slaUsedDefault = !Number.isFinite(targetInputParsed) && slaMTTC === 0;
  const slaMTTCTarget = Math.max(1, Number.isFinite(targetInputParsed) ? targetInputParsed : 24);

  let slaCompliance: number;
  if (slaUsedDefault) {
    slaCompliance = NEUTRAL_DEFAULT;
  } else if (slaMTTC <= slaMTTCTarget) {
    slaCompliance = 100;
  } else {
    slaCompliance = clamp(Math.max(0, 100 - ((slaMTTC - slaMTTCTarget) / slaMTTCTarget) * 100), 0, 100);
  }

  const operationalScore = clamp(0.70 * kpiAchievement + 0.30 * slaCompliance, 0, 100);

  // --- Final SPI ---
  const W_COMPLIANCE = 0.25;
  const W_MATURITY = 0.20;
  const W_ASSET = 0.15;
  const W_RISK = 0.25;
  const W_OPERATIONAL = 0.15;

  const wCompliance = complianceScore * W_COMPLIANCE;
  const wMaturity = maturityScore * W_MATURITY;
  const wAsset = assetProtectionScore * W_ASSET;
  const wRisk = riskPostureScore * W_RISK;
  const wOperational = operationalScore * W_OPERATIONAL;

  const rawScore = wCompliance + wMaturity + wAsset + wRisk + wOperational;
  const finalScore = clamp(Math.round(rawScore), 0, 100);

  return {
    securityScore: finalScore,
    scoreBreakdown: {
      formulaVersion: 'v2',
      equation:
        'SPI = clamp(round(0.25×Compliance + 0.20×Maturity + 0.15×AssetProtection + 0.25×RiskPosture + 0.15×Operational), 0, 100)',
      finalScore,
      rawScore: roundTo(rawScore),

      weights: {
        compliance: W_COMPLIANCE,
        maturity: W_MATURITY,
        assetProtection: W_ASSET,
        riskPosture: W_RISK,
        operational: W_OPERATIONAL,
      },

      complianceDetails: {
        inputValue: roundTo(complianceInput),
        score: roundTo(complianceScore),
      },

      maturityDetails: {
        domainCount: normalizedMaturityScores.length,
        normalizedScores: normalizedMaturityScores.map((s) => roundTo(s)),
        usedNeutralDefault: maturityUsedDefault,
        score: roundTo(maturityScore),
      },

      assetProtectionDetails: {
        assetCount: protectionLevels.length,
        protectionLevels: protectionLevels.map((p) => roundTo(p)),
        usedNeutralDefault: assetUsedDefault,
        score: roundTo(assetProtectionScore),
      },

      riskPostureDetails: {
        totalRisks: risks.length,
        openRisks: openCount,
        inProgressRisks: inProgressCount,
        closedRisks: closedCount,
        totalDeduction: roundTo(totalDeduction),
        perRiskDeductions,
        score: roundTo(riskPostureScore),
      },

      operationalDetails: {
        kpiAchievement: roundTo(kpiAchievement),
        kpiCount: normalizedKpis.length,
        normalizedKpis: normalizedKpis.map((kpi) => ({
          id: kpi.id,
          title: kpi.title,
          actual: roundTo(kpi.actual, 2),
          target: roundTo(kpi.target, 2),
          lowerBetter: kpi.lowerBetter,
          normalized: roundTo(kpi.normalized),
        })),
        kpiUsedNeutralDefault: kpiUsedDefault,
        slaCompliance: roundTo(slaCompliance),
        slaMTTC: roundTo(slaMTTC),
        slaMTTCTarget: roundTo(slaMTTCTarget),
        slaUsedNeutralDefault: slaUsedDefault,
        score: roundTo(operationalScore),
      },

      componentScores: {
        compliance: roundTo(complianceScore),
        maturity: roundTo(maturityScore),
        assetProtection: roundTo(assetProtectionScore),
        riskPosture: roundTo(riskPostureScore),
        operational: roundTo(operationalScore),
      },

      weightedContributions: {
        compliance: roundTo(wCompliance),
        maturity: roundTo(wMaturity),
        assetProtection: roundTo(wAsset),
        riskPosture: roundTo(wRisk),
        operational: roundTo(wOperational),
      },
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
