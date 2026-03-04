import { create } from 'zustand';
import type { ReportData, Decision, Risk, MaturityDomain, Recommendation } from '@/types/report';

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
  updateMaturity: (index: number, score: number) => void;

  // Recommendations
  addRecommendation: () => void;
  updateRecommendation: (index: number, data: Partial<Recommendation>) => void;
  removeRecommendation: (index: number) => void;
}

function uuid() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2);
}

export const useReportStore = create<ReportStore>((set, get) => ({
  report: null,
  currentStep: 0,
  isSaving: false,
  lastSaved: null,
  isDirty: false,

  setReport: (report) => set({ report, isDirty: false }),
  setStep: (step) => set({ currentStep: Math.max(0, Math.min(6, step)) }),
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

  updateMaturity: (index, score) => {
    const { report } = get();
    if (!report) return;
    const domains = [...report.maturityDomains];
    domains[index] = { ...domains[index], score };
    set({ report: { ...report, maturityDomains: domains }, isDirty: true });
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
}));
