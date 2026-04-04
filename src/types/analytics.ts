export interface AnalyticsSummary {
  totalReports: number;
  avgSecurityScore: number;
  avgCompliance: number;
  avgPrevCompliance: number;
  complianceDelta: number;
  totalRisks: number;
  openRisks: number;
  criticalRisks: number;
  avgMaturityScore: number;
}

export type AnalyticsRiskSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AnalyticsRiskStatus = 'open' | 'inprogress' | 'closed';
export type AnalyticsGroupBy = 'none' | 'severity' | 'status' | 'system' | 'organization';

export interface AnalyticsInsight {
  type: 'alert' | 'info' | 'success';
  title: string;
  message: string;
}

export interface AnalyticsVelocity {
  recentRiskSignals: number;
  activeRisks: number;
  closedRisks: number;
  closureRate: number;
  criticalExposure: number;
}

export interface AnalyticsGroupItem {
  key: string;
  label: string;
  count: number;
  openCount: number;
  avgScore: number;
}

export interface AnalyticsGroupedSlice {
  dimension: AnalyticsGroupBy;
  items: AnalyticsGroupItem[];
}

export interface AnalyticsTrendPoint {
  reportId: string;
  orgName: string;
  date: string;
  securityScore: number;
  compliance: number;
  riskCount: number;
}

export interface AnalyticsRiskDistribution {
  severity: AnalyticsRiskSeverity;
  count: number;
}

export interface AnalyticsTopRisk {
  reportId: string;
  reportName: string;
  system: string;
  description: string;
  severity: AnalyticsRiskSeverity;
  status: AnalyticsRiskStatus;
  score: number;
}

export interface AnalyticsIsoCoverage {
  domainId: string;
  domainName: string;
  applied: number;
  total: number;
  coverage: number;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  insights: AnalyticsInsight[];
  velocity: AnalyticsVelocity;
  trend: AnalyticsTrendPoint[];
  riskDistribution: AnalyticsRiskDistribution[];
  topRisks: AnalyticsTopRisk[];
  grouped: AnalyticsGroupedSlice;
  isoCoverage: AnalyticsIsoCoverage[];
  overallIsoCoverage: number;
}

export interface AnalyticsQueryOptions {
  from?: string;
  to?: string;
  limit?: number;
  groupBy?: AnalyticsGroupBy;
  riskSeverity?: AnalyticsRiskSeverity;
  riskStatus?: AnalyticsRiskStatus;
  reportId?: string;
}

export type AnalyticsSummaryAudience = 'leadership' | 'board' | 'ciso';

export interface AnalyticsAISummaryRequest extends AnalyticsQueryOptions {
  audience?: AnalyticsSummaryAudience;
  forceRefresh?: boolean;
}

export interface AnalyticsAISummaryResponse {
  content: string;
  audience: AnalyticsSummaryAudience;
  generatedAt: string;
  cacheHit: boolean;
  provider: 'gemini' | 'nvidia';
  model: string;
  queryHash: string;
  keyMetrics: {
    totalReports: number;
    avgSecurityScore: number;
    openRisks: number;
    criticalRisks: number;
    overallIsoCoverage: number;
    complianceDelta: number;
  };
}