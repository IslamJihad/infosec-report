import type { ReportData } from '@/types/report';

export type SearchSurface = 'editor' | 'preview';

export type SearchSectionKey =
  | 'general'
  | 'executive'
  | 'risks'
  | 'assets'
  | 'sps'
  | 'kpi'
  | 'efficiency'
  | 'sla'
  | 'actions'
  | 'maturity';

interface SectionMeta {
  label: string;
  step: number;
}

const SECTION_META: Record<SearchSectionKey, SectionMeta> = {
  general: { label: 'معلومات التقرير', step: 0 },
  executive: { label: 'الملخص التنفيذي', step: 1 },
  risks: { label: 'المخاطر الرئيسية', step: 2 },
  assets: { label: 'حماية الأصول الحيوية', step: 3 },
  sps: { label: 'مؤشرات وضع الأمان', step: 4 },
  kpi: { label: 'المؤشرات والمعايير', step: 5 },
  efficiency: { label: 'مؤشرات الكفاءة التشغيلية', step: 6 },
  sla: { label: 'مقاييس الاستجابة', step: 7 },
  actions: { label: 'التوصيات والإجراءات', step: 8 },
  maturity: { label: 'مستوى النضج الأمني', step: 9 },
};

export interface SearchEntry {
  id: string;
  section: SearchSectionKey;
  sectionLabel: string;
  sectionStep: number;
  title: string;
  snippet: string;
  targetId: string;
  sectionTargetId: string;
  normalizedText: string;
}

export interface ReportSearchResult {
  id: string;
  section: SearchSectionKey;
  sectionLabel: string;
  sectionStep: number;
  title: string;
  snippet: string;
  score: number;
  targetId: string;
  sectionTargetId: string;
}

export interface ReportSearchPage {
  results: ReportSearchResult[];
  total: number;
  shown: number;
  hasMore: boolean;
}

export interface SearchOptions {
  limit?: number;
  minimumScore?: number;
}

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u200E\u200F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/[\s\-_/]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[] = new Array(rows * cols).fill(0);

  for (let i = 0; i < rows; i += 1) dp[i * cols] = i;
  for (let j = 0; j < cols; j += 1) dp[j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const del = dp[(i - 1) * cols + j] + 1;
      const ins = dp[i * cols + (j - 1)] + 1;
      const sub = dp[(i - 1) * cols + (j - 1)] + cost;
      dp[i * cols + j] = Math.min(del, ins, sub);
    }
  }

  return dp[rows * cols - 1];
}

function getClosestDistance(token: string, words: string[]): number {
  if (!words.length) return token.length;
  let minDistance = Number.POSITIVE_INFINITY;

  for (const word of words) {
    const distance = levenshtein(token, word);
    if (distance < minDistance) minDistance = distance;
    if (minDistance === 0) return 0;
  }

  return minDistance;
}

function scoreEntry(entry: SearchEntry, normalizedQuery: string, queryTokens: string[]): number {
  let score = 0;
  const text = entry.normalizedText;

  if (text.includes(normalizedQuery)) {
    score += 130;
    if (text.startsWith(normalizedQuery)) score += 20;
  }

  const words = Array.from(new Set(text.split(/\s+/g).filter((token) => token.length > 1))).slice(0, 60);

  for (const token of queryTokens) {
    if (text.includes(token)) {
      score += 14;
      continue;
    }

    const closest = getClosestDistance(token, words);
    const maxLength = Math.max(token.length, 1);
    const similarity = 1 - closest / maxLength;

    if (similarity >= 0.72) {
      score += Math.round(similarity * 12);
    }
  }

  const phraseDistance = getClosestDistance(normalizedQuery, words);
  if (phraseDistance <= 2 && normalizedQuery.length >= 4) {
    score += 18 - phraseDistance * 4;
  } else if (phraseDistance <= 4 && normalizedQuery.length >= 6) {
    score += 6;
  }

  return score;
}

function resolveMinimumScore(normalizedQuery: string, queryTokens: string[], override?: number): number {
  if (typeof override === 'number' && Number.isFinite(override)) {
    return Math.max(0, Math.round(override));
  }

  // Short or single-token queries need a lower threshold, otherwise valid matches get dropped.
  if (queryTokens.length <= 1) {
    return normalizedQuery.length <= 4 ? 13 : 15;
  }

  return 18;
}

function createSectionTargetId(surface: SearchSurface, section: SearchSectionKey): string {
  return `search-${surface}-section-${section}`;
}

function createEntry(args: {
  id: string;
  section: SearchSectionKey;
  title: string;
  snippet: string;
  textParts: Array<string | number | null | undefined>;
  targetId: string;
  surface: SearchSurface;
}): SearchEntry | null {
  const sectionMeta = SECTION_META[args.section];
  const content = args.textParts
    .map((value) => (value == null ? '' : String(value).trim()))
    .filter(Boolean)
    .join(' ')
    .trim();

  if (!content) return null;

  const sectionTargetId = createSectionTargetId(args.surface, args.section);

  return {
    id: args.id,
    section: args.section,
    sectionLabel: sectionMeta.label,
    sectionStep: sectionMeta.step,
    title: args.title,
    snippet: args.snippet || content,
    targetId: args.targetId,
    sectionTargetId,
    normalizedText: normalizeText(`${args.title} ${content}`),
  };
}

export function buildReportSearchIndex(report: ReportData, surface: SearchSurface): SearchEntry[] {
  const entries: SearchEntry[] = [];
  const isPreview = surface === 'preview';

  const push = (entry: SearchEntry | null) => {
    if (entry) entries.push(entry);
  };

  push(createEntry({
    id: 'general-main',
    section: 'general',
    title: 'معلومات التقرير',
    snippet: report.orgName,
    textParts: [
      report.title,
      report.orgName,
      report.subject,
      report.recipientName,
      report.period,
      report.issueDate,
      report.version,
      report.author,
      report.classification,
      report.chairNote,
    ],
    targetId: createSectionTargetId(surface, 'general'),
    surface,
  }));

  push(createEntry({
    id: 'executive-main',
    section: 'executive',
    title: 'الملخص التنفيذي',
    snippet: report.summary,
    textParts: [
      report.summary,
      report.securityLevel,
      report.trend,
      report.securityScore,
    ],
    targetId: createSectionTargetId(surface, 'executive'),
    surface,
  }));

  for (const decision of report.decisions) {
    push(createEntry({
      id: `decision-${decision.id}`,
      section: 'executive',
      title: decision.title || 'قرار إداري',
      snippet: decision.description,
      textParts: [decision.title, decision.description, decision.department, decision.owner, decision.timeline, decision.budget],
      targetId: `search-${surface}-decision-${decision.id}`,
      surface,
    }));
  }

  for (const risk of report.risks) {
    push(createEntry({
      id: `risk-${risk.id}`,
      section: 'risks',
      title: risk.description || 'مخاطرة',
      snippet: risk.system || risk.worstCase || risk.requiredControls,
      textParts: [risk.description, risk.system, risk.severity, risk.status, risk.worstCase, risk.requiredControls, risk.affectedAssets, risk.probability, risk.impact],
      targetId: `search-${surface}-risk-${risk.id}`,
      surface,
    }));
  }

  for (const asset of report.assets) {
    push(createEntry({
      id: `asset-${asset.id}`,
      section: 'assets',
      title: asset.name || 'أصل حيوي',
      snippet: asset.value || asset.gaps,
      textParts: [asset.name, asset.value, asset.gaps, asset.protectionLevel],
      targetId: `search-${surface}-asset-${asset.id}`,
      surface,
    }));
  }

  for (const domain of (report.spsDomains ?? [])) {
    push(createEntry({
      id: `sps-${domain.id}`,
      section: 'sps',
      title: domain.nameAr || domain.nameEn || 'مجال SPS',
      snippet: domain.subMetrics.map((sm) => sm.nameAr).join('، '),
      textParts: [domain.nameAr, domain.nameEn, ...domain.subMetrics.map((sm) => sm.nameAr)],
      targetId: createSectionTargetId(surface, 'sps'),
      surface,
    }));
  }

  push(createEntry({
    id: 'kpi-main',
    section: 'kpi',
    title: 'المؤشرات والمعايير',
    snippet: report.kpiComment?.trim() || `امتثال ISO ${report.kpiCompliance}%`,
    textParts: [
      report.kpiCritical,
      report.kpiVuln,
      report.kpiTotal,
      report.kpiCompliance,
      report.prevCritical,
      report.prevVuln,
      report.prevTotal,
      report.prevCompliance,
      report.vulnCritical,
      report.vulnHigh,
      report.vulnMedium,
      report.vulnLow,
      report.incOpen,
      report.incProgress,
      report.incClosed,
      report.incWatch,
      report.bmScore,
      report.bmCompliance,
      report.bmSector,
      report.kpiComment,
    ],
    targetId: createSectionTargetId(surface, 'kpi'),
    surface,
  }));

  for (const control of report.isoControls) {
    push(createEntry({
      id: `iso-${control.domainId}`,
      section: 'kpi',
      title: `${control.domainId} ${control.domainName}`,
      snippet: `${control.currentApplied}/${control.totalControls}`,
      textParts: [control.domainId, control.domainName, control.totalControls, control.currentApplied, control.previousApplied],
      targetId: `search-${surface}-iso-${control.domainId}`,
      surface,
    }));
  }

  for (const kpi of report.efficiencyKPIs) {
    push(createEntry({
      id: `efficiency-${kpi.id}`,
      section: 'efficiency',
      title: kpi.title || 'مؤشر كفاءة',
      snippet: kpi.description,
      textParts: [kpi.title, kpi.description, kpi.val, kpi.target, kpi.unit, kpi.lowerBetter ? 'الأقل أفضل' : 'الأعلى أفضل'],
      targetId: `search-${surface}-efficiency-${kpi.id}`,
      surface,
    }));
  }

  if (report.showSLA || !isPreview) {
    push(createEntry({
      id: 'sla-main',
      section: 'sla',
      title: 'مقاييس الاستجابة',
      snippet: `MTTC ${report.slaMTTC} / الهدف ${report.slaMTTCTarget}`,
      textParts: [report.slaMTTC, report.slaMTTCTarget, report.slaRate, report.slaBreach],
      targetId: createSectionTargetId(surface, 'sla'),
      surface,
    }));
  }

  for (const recommendation of report.recommendations) {
    push(createEntry({
      id: `recommendation-${recommendation.id}`,
      section: 'actions',
      title: recommendation.title || 'توصية',
      snippet: recommendation.description,
      textParts: [recommendation.title, recommendation.description, recommendation.priority, recommendation.department, recommendation.timeline, recommendation.owner],
      targetId: `search-${surface}-recommendation-${recommendation.id}`,
      surface,
    }));
  }

  for (const challenge of report.challenges) {
    push(createEntry({
      id: `challenge-${challenge.id}`,
      section: 'actions',
      title: challenge.title || 'تحدي',
      snippet: challenge.requirement || challenge.rootCause,
      textParts: [challenge.title, challenge.type, challenge.rootCause, challenge.requirement],
      targetId: `search-${surface}-challenge-${challenge.id}`,
      surface,
    }));
  }

  if (report.showMaturity || !isPreview) {
    for (const maturity of report.maturityDomains) {
      push(createEntry({
        id: `maturity-${maturity.id}`,
        section: 'maturity',
        title: maturity.name || 'بند نضج',
        snippet: `${maturity.score}%`,
        textParts: [maturity.name, maturity.score],
        targetId: `search-${surface}-maturity-${maturity.id}`,
        surface,
      }));
    }
  }

  return entries;
}

export function searchReportIndex(entries: SearchEntry[], query: string, options: SearchOptions = {}): ReportSearchPage {
  const normalizedQuery = normalizeText(query);
  if (normalizedQuery.length < 2) {
    return {
      results: [],
      total: 0,
      shown: 0,
      hasMore: false,
    };
  }

  const queryTokens = tokenize(query);
  const safeLimit = Math.max(1, Math.round(options.limit ?? 40));
  const minimumScore = resolveMinimumScore(normalizedQuery, queryTokens, options.minimumScore);

  const ranked = entries
    .map((entry) => {
      const score = scoreEntry(entry, normalizedQuery, queryTokens);
      return { entry, score };
    })
    .filter((item) => item.score >= minimumScore)
    .sort((a, b) => b.score - a.score || a.entry.sectionStep - b.entry.sectionStep);

  const visible = ranked.slice(0, safeLimit).map(({ entry, score }) => ({
    id: entry.id,
    section: entry.section,
    sectionLabel: entry.sectionLabel,
    sectionStep: entry.sectionStep,
    title: entry.title,
    snippet: entry.snippet,
    score,
    targetId: entry.targetId,
    sectionTargetId: entry.sectionTargetId,
  }));

  return {
    results: visible,
    total: ranked.length,
    shown: visible.length,
    hasMore: ranked.length > visible.length,
  };
}
