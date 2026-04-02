export interface ReportData {
  id: string;
  title: string;
  orgName: string;
  subject: string;
  recipientName: string;
  period: string;
  issueDate: string;
  version: string;
  author: string;
  classification: string;
  logoBase64: string;
  summary: string;
  securityLevel: string;
  securityScore: number;
  trend: string;
  status: string;
  chairNote: string;

  kpiCritical: number;
  kpiVuln: number;
  kpiTotal: number;
  kpiCompliance: number;
  prevCritical: number;
  prevVuln: number;
  prevTotal: number;
  prevCompliance: number;

  vulnCritical: number;
  vulnHigh: number;
  vulnMedium: number;
  vulnLow: number;

  incOpen: number;
  incProgress: number;
  incClosed: number;
  incWatch: number;

  slaMTTC: number;
  slaMTTCTarget: number;
  slaRate: number;
  slaBreach: number;

  // ROI & Benchmark
  vulnResolved: number;
  vulnRecurring: number;
  bmScore: number;
  bmCompliance: number;
  bmSector: string;

  // ISO Controls (JSON-serialized array of 14 domains)
  isoControls: ISOControl[];

  showSLA: boolean;
  showMaturity: boolean;

  createdAt: string;
  updatedAt: string;

  decisions: Decision[];
  risks: Risk[];
  maturityDomains: MaturityDomain[];
  recommendations: Recommendation[];
  assets: Asset[];
  challenges: Challenge[];
  efficiencyKPIs: EfficiencyKPI[];
}

export interface Decision {
  id: string;
  reportId?: string;
  title: string;
  description: string;
  budget: string;
  department: string;
  timeline: string;
  owner: string;
  sortOrder: number;
}

export interface Risk {
  id: string;
  reportId?: string;
  description: string;
  system: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'inprogress' | 'closed';
  probability: number;
  impact: number;
  worstCase: string;
  requiredControls: string;
  affectedAssets: string;
  sortOrder: number;
}

export interface MaturityDomain {
  id: string;
  reportId?: string;
  name: string;
  score: number;
  sortOrder: number;
}

export interface Recommendation {
  id: string;
  reportId?: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  department: string;
  timeline: string;
  owner: string;
  sortOrder: number;
}

export interface EfficiencyKPI {
  id: string;
  reportId?: string;
  title: string;
  val: number;
  target: number;
  unit: string;
  description: string;
  lowerBetter: boolean;
  sortOrder: number;
}

export interface Asset {
  id: string;
  reportId?: string;
  name: string;
  value: string;
  protectionLevel: number;
  gaps: string;
  sortOrder: number;
}

export interface Challenge {
  id: string;
  reportId?: string;
  title: string;
  type: 'budget' | 'staff' | 'tech' | 'process';
  rootCause: string;
  requirement: string;
  sortOrder: number;
}

export interface ISOControl {
  domainId: string;
  domainName: string;
  totalControls: number;
  currentApplied: number;
  previousApplied: number;
}

export interface AppSettings {
  id: string;
  aiProvider: 'gemini' | 'nvidia';
  aiModel: string;
  geminiApiKey: string;
  nvidiaApiKey: string;
  aiApiKey?: string; // legacy compatibility
  defaultOrgName: string;
  defaultAuthor: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ReviewType = 'full' | 'exec' | 'board' | 'risk' | 'gaps';
