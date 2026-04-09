import { create } from 'zustand';
import type { ReportData, Decision, Risk, MaturityDomain, Recommendation, Challenge, EfficiencyKPI } from '@/types/report';
import { DEFAULT_SPS_DOMAINS, NAV_ITEMS } from '@/lib/constants';

interface ReportStore {
  report: ReportData | null;
  currentStep: number;
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;

  setReport: (report: ReportData) => void;
  setStep: (step: number) => void;
  setSaving: (saving: boolean) => void;
  setLastSaved: (date: Date) => void;
  setDirty: (dirty: boolean) => void;

  // Field updates
  updateField: <K extends keyof ReportData>(key: K, value: ReportData[K]) => void;
  updateFields: (fields: Partial<ReportData>) => void;

  // Decisions
  addDecision: () => void;
  updateDecision: (index: number, data: Partial<Decision>) => void;
  removeDecision: (index: number) => void;

  // Risks
  addRisk: () => void;
  updateRisk: (index: number, data: Partial<Risk>) => void;
  removeRisk: (index: number) => void;

  // Maturity
  updateMaturity: (index: number, data: Partial<Pick<MaturityDomain, 'name' | 'score'>>) => void;
  addMaturity: () => void;
  removeMaturity: (index: number) => void;

  // Recommendations
  addRecommendation: () => void;
  updateRecommendation: (index: number, data: Partial<Recommendation>) => void;
  removeRecommendation: (index: number) => void;

  // Challenges
  addChallenge: () => void;
  updateChallenge: (index: number, data: Partial<Challenge>) => void;
  removeChallenge: (index: number) => void;

  // Efficiency KPIs
  addEfficiencyKPI: () => void;
  updateEfficiencyKPI: (index: number, data: Partial<EfficiencyKPI>) => void;
  removeEfficiencyKPI: (index: number) => void;

  // ISO Controls
  updateISOControl: (index: number, field: 'currentApplied' | 'previousApplied', value: number) => void;

  // SPS Domains
  updateSPSSubMetric: (domainId: string, subMetricId: string, value: number) => void;
  resetSPSDomains: () => void;
}

function uuid() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2);
}

function normalizeMaturityScore(score: number) {
  const parsed = Number(score);
  if (!Number.isFinite(parsed)) return 0;
  // Backward compatibility: old values were 1..5 and are converted to 20..100.
  if (parsed > 0 && parsed <= 5) return Math.round(parsed * 20);
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

export const useReportStore = create<ReportStore>((set, get) => ({
  report: null,
  currentStep: 0,
  isSaving: false,
  lastSaved: null,
  isDirty: false,

  setReport: (report) => set({
    report: {
      ...report,
      maturityDomains: (report.maturityDomains || []).map((domain) => ({
        ...domain,
        score: normalizeMaturityScore(domain.score),
      })),
    },
    isDirty: false,
  }),
  setStep: (step) => set({ currentStep: Math.max(0, Math.min(NAV_ITEMS.length - 1, step)) }),
  setSaving: (saving) => set({ isSaving: saving }),
  setLastSaved: (date) => set({ lastSaved: date }),
  setDirty: (dirty) => set({ isDirty: dirty }),

  updateField: (key, value) => {
    const { report } = get();
    if (!report) return;
    set({ report: { ...report, [key]: value }, isDirty: true });
  },

  updateFields: (fields) => {
    const { report } = get();
    if (!report) return;
    set({ report: { ...report, ...fields }, isDirty: true });
  },

  addDecision: () => {
    const { report } = get();
    if (!report) return;
    const newDec: Decision = {
      id: uuid(),
      title: '',
      description: '',
      budget: '',
      department: '',
      timeline: '',
      owner: '',
      sortOrder: report.decisions.length,
    };
    set({ report: { ...report, decisions: [...report.decisions, newDec] }, isDirty: true });
  },

  updateDecision: (index, data) => {
    const { report } = get();
    if (!report) return;
    const decisions = [...report.decisions];
    decisions[index] = { ...decisions[index], ...data };
    set({ report: { ...report, decisions }, isDirty: true });
  },

  removeDecision: (index) => {
    const { report } = get();
    if (!report) return;
    set({ report: { ...report, decisions: report.decisions.filter((_, i) => i !== index) }, isDirty: true });
  },

  addRisk: () => {
    const { report } = get();
    if (!report) return;
    const newRisk: Risk = {
      id: uuid(),
      description: '',
      system: '',
      severity: 'medium',
      status: 'open',
      probability: 3,
      impact: 3,
      worstCase: '',
      requiredControls: '',
      affectedAssets: '',
      sortOrder: report.risks.length,
    };
    set({ report: { ...report, risks: [...report.risks, newRisk] }, isDirty: true });
  },

  updateRisk: (index, data) => {
    const { report } = get();
    if (!report) return;
    const risks = [...report.risks];
    risks[index] = { ...risks[index], ...data };
    set({ report: { ...report, risks }, isDirty: true });
  },

  removeRisk: (index) => {
    const { report } = get();
    if (!report) return;
    set({ report: { ...report, risks: report.risks.filter((_, i) => i !== index) }, isDirty: true });
  },

  updateMaturity: (index, data) => {
    const { report } = get();
    if (!report) return;
    const domains = [...report.maturityDomains];
    if (!domains[index]) return;
    domains[index] = {
      ...domains[index],
      ...(typeof data.name === 'string' ? { name: data.name } : {}),
      ...(typeof data.score === 'number' ? { score: normalizeMaturityScore(data.score) } : {}),
    };
    set({ report: { ...report, maturityDomains: domains }, isDirty: true });
  },

  addMaturity: () => {
    const { report } = get();
    if (!report) return;
    const next: MaturityDomain = {
      id: uuid(),
      name: '',
      score: 0,
      sortOrder: report.maturityDomains.length,
    };
    set({ report: { ...report, maturityDomains: [...report.maturityDomains, next] }, isDirty: true });
  },

  removeMaturity: (index) => {
    const { report } = get();
    if (!report) return;
    const filtered = report.maturityDomains.filter((_, i) => i !== index).map((item, i) => ({ ...item, sortOrder: i }));
    set({ report: { ...report, maturityDomains: filtered }, isDirty: true });
  },

  addRecommendation: () => {
    const { report } = get();
    if (!report) return;
    const newRec: Recommendation = {
      id: uuid(),
      title: '',
      description: '',
      priority: 'medium',
      department: '',
      timeline: '',
      owner: '',
      sortOrder: report.recommendations.length,
    };
    set({ report: { ...report, recommendations: [...report.recommendations, newRec] }, isDirty: true });
  },

  updateRecommendation: (index, data) => {
    const { report } = get();
    if (!report) return;
    const recs = [...report.recommendations];
    recs[index] = { ...recs[index], ...data };
    set({ report: { ...report, recommendations: recs }, isDirty: true });
  },

  removeRecommendation: (index) => {
    const { report } = get();
    if (!report) return;
    set({ report: { ...report, recommendations: report.recommendations.filter((_, i) => i !== index) }, isDirty: true });
  },

  // Challenges
  addChallenge: () => {
    const { report } = get();
    if (!report) return;
    const newChal: Challenge = {
      id: uuid(),
      title: '',
      type: 'budget',
      rootCause: '',
      requirement: '',
      sortOrder: report.challenges.length,
    };
    set({ report: { ...report, challenges: [...report.challenges, newChal] }, isDirty: true });
  },

  updateChallenge: (index, data) => {
    const { report } = get();
    if (!report) return;
    const challenges = [...report.challenges];
    challenges[index] = { ...challenges[index], ...data };
    set({ report: { ...report, challenges }, isDirty: true });
  },

  removeChallenge: (index) => {
    const { report } = get();
    if (!report) return;
    set({ report: { ...report, challenges: report.challenges.filter((_, i) => i !== index) }, isDirty: true });
  },

  // Efficiency KPIs
  addEfficiencyKPI: () => {
    const { report } = get();
    if (!report) return;
    const newKPI: EfficiencyKPI = {
      id: uuid(),
      title: '',
      val: 0,
      target: 100,
      unit: '%',
      description: '',
      lowerBetter: false,
      sortOrder: (report.efficiencyKPIs || []).length,
    };
    set({ report: { ...report, efficiencyKPIs: [...(report.efficiencyKPIs || []), newKPI] }, isDirty: true });
  },

  updateEfficiencyKPI: (index, data) => {
    const { report } = get();
    if (!report) return;
    const efficiencyKPIs = [...(report.efficiencyKPIs || [])];
    efficiencyKPIs[index] = { ...efficiencyKPIs[index], ...data };
    set({ report: { ...report, efficiencyKPIs }, isDirty: true });
  },

  removeEfficiencyKPI: (index) => {
    const { report } = get();
    if (!report) return;
    set({ report: { ...report, efficiencyKPIs: (report.efficiencyKPIs || []).filter((_, i) => i !== index) }, isDirty: true });
  },

  // ISO Controls
  updateISOControl: (index, field, value) => {
    const { report } = get();
    if (!report) return;
    const controls = [...report.isoControls];
    controls[index] = { ...controls[index], [field]: value };
    set({ report: { ...report, isoControls: controls }, isDirty: true });
  },

  // SPS Domains
  updateSPSSubMetric: (domainId, subMetricId, value) => {
    const { report } = get();
    if (!report) return;
    const spsDomains = (report.spsDomains ?? DEFAULT_SPS_DOMAINS).map((domain) => {
      if (domain.id !== domainId) return domain;
      return {
        ...domain,
        subMetrics: domain.subMetrics.map((sm) =>
          sm.id === subMetricId ? { ...sm, value: Math.max(0, Math.min(100, value)) } : sm
        ),
      };
    });
    set({ report: { ...report, spsDomains }, isDirty: true });
  },

  resetSPSDomains: () => {
    const { report } = get();
    if (!report) return;
    set({ report: { ...report, spsDomains: DEFAULT_SPS_DOMAINS }, isDirty: true });
  },
}));
