'use client';

import type { ReportData } from '@/types/report';
import {
  formatArabicDate,
  getDeltaInfo,
  SEVERITY_MAP,
  STATUS_MAP,
  PRIORITY_MAP,
  CHALLENGE_TYPES,
  DEFAULT_SPS_DOMAINS,
} from '@/lib/constants';
import { calculateGlobalSecurityScore, getPercentileText } from '@/lib/scoring';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Props {
  report: ReportData;
}

type SectionId = 'exec' | 'eff' | 'risks' | 'sps' | 'ind' | 'sla' | 'act' | 'mat';

interface SectionDefinition {
  id: SectionId;
  title: string;
  rag: string;
  visible: boolean;
}

function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function formatMetricValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const BULLET_LINE_PATTERN = /^[-*•]\s+/;

const MULTILINE_TEXT_STYLE = {
  whiteSpace: 'pre-wrap' as const,
  overflowWrap: 'anywhere' as const,
  wordBreak: 'break-word' as const,
};

type RenderSegment =
  | { kind: 'paragraph'; lines: string[] }
  | { kind: 'bullets'; items: string[] };

interface MultilineRenderOptions {
  fontSize?: number;
  lineHeight?: number;
  color?: string;
  fontWeight?: number | string;
  emptyText?: string;
  gap?: number;
}

function renderFormattedText(
  value: string | null | undefined,
  options: MultilineRenderOptions = {},
) {
  const normalized = (value ?? '').replace(/\r\n?/g, '\n').trim();

  const baseTextStyle = {
    ...MULTILINE_TEXT_STYLE,
    fontSize: options.fontSize ?? 10,
    lineHeight: options.lineHeight ?? 1.8,
    color: options.color ?? '#475569',
    fontWeight: options.fontWeight,
  };

  if (!normalized) {
    return <span style={baseTextStyle}>{options.emptyText ?? '—'}</span>;
  }

  const segments: RenderSegment[] = [];
  const paragraphBuffer: string[] = [];
  const bulletBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    segments.push({ kind: 'paragraph', lines: [...paragraphBuffer] });
    paragraphBuffer.length = 0;
  };

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    segments.push({ kind: 'bullets', items: [...bulletBuffer] });
    bulletBuffer.length = 0;
  };

  for (const rawLine of normalized.split('\n')) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushBullets();
      continue;
    }

    if (BULLET_LINE_PATTERN.test(trimmed)) {
      flushParagraph();
      bulletBuffer.push(trimmed.replace(BULLET_LINE_PATTERN, '').trim() || '—');
      continue;
    }

    flushBullets();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushBullets();

  if (segments.length === 0) {
    return <span style={baseTextStyle}>{options.emptyText ?? '—'}</span>;
  }

  return (
    <div style={{ display: 'grid', gap: options.gap ?? 6 }}>
      {segments.map((segment, index) => {
        if (segment.kind === 'bullets') {
          return (
            <div key={`bullets-${index}`} style={{ display: 'grid', gap: 4 }}>
              {segment.items.map((item, itemIndex) => (
                <p key={`bullet-item-${itemIndex}`} style={{ ...baseTextStyle, margin: 0 }}>
                  - {item}
                </p>
              ))}
            </div>
          );
        }

        return (
          <p key={`paragraph-${index}`} style={{ ...baseTextStyle, margin: 0 }}>
            {segment.lines.join('\n')}
          </p>
        );
      })}
    </div>
  );
}

export default function ReportPreview({ report }: Props) {
  const r = report;
  const dateF = formatArabicDate(r.issueDate);

  const risks = ensureArray(r.risks);
  const recommendations = ensureArray(r.recommendations);
  const challenges = ensureArray(r.challenges);
  const maturityDomains = ensureArray(r.maturityDomains);
  const effKPIs = ensureArray(r.efficiencyKPIs);
  const spsDomains = Array.isArray(r.spsDomains) && r.spsDomains.length > 0
    ? r.spsDomains : DEFAULT_SPS_DOMAINS;

  const totalVulnRaw = r.vulnCritical + r.vulnHigh + r.vulnMedium + r.vulnLow;
  const totalVuln = totalVulnRaw > 0 ? totalVulnRaw : 1;
  const sortedRisks = [...risks].sort((a, b) => b.probability * b.impact - a.probability * a.impact);
  const critRisks = sortedRisks.filter(risk => risk.probability * risk.impact >= 15).length;
  const avgMatValue = maturityDomains.length > 0
    ? maturityDomains.reduce((sum, domain) => sum + domain.score, 0) / maturityDomains.length
    : 0;
  const avgMat = avgMatValue.toFixed(1);
  const trendUp = r.trend.includes('↑') || r.trend.includes('↗');
  const trendDown = r.trend.includes('↓') || r.trend.includes('↘');
  const fallbackScoreResult = calculateGlobalSecurityScore({ id: r.id, spsDomains });
  const scoreBreakdown = r.scoreBreakdown ?? fallbackScoreResult.scoreBreakdown;
  const finalScore = r.scoreBreakdown ? r.securityScore : fallbackScoreResult.securityScore;
  const { domainResults } = scoreBreakdown;
  const avgProt = (() => {
    const assetDomain = domainResults.find((domain) => (
      domain.id === 'asset-protection'
      || domain.id === 'assetProtection'
      || domain.nameEn.toLowerCase().includes('asset')
    ));

    if (assetDomain) {
      return Math.round(assetDomain.domainScore);
    }

    return Math.round((finalScore + r.kpiCompliance) / 2);
  })();

  const scoreColor = (s: number) => s >= 75 ? '#16a34a' : s >= 50 ? '#d97706' : '#dc2626';
  const ragColor = (rag: string) => {
    if (rag === 'r') return '#dc2626';
    if (rag === 'a') return '#f59e0b';
    if (rag === 'g') return '#16a34a';
    return '#64748b';
  };
  const ragLabel = (rag: string) => {
    if (rag === 'r') return 'يستوجب تدخلاً';
    if (rag === 'a') return 'يستوجب متابعة';
    if (rag === 'g') return 'وضع جيد';
    return 'لا عناصر';
  };
  const ragBg = (rag: string) => {
    if (rag === 'r') return '#fef2f2';
    if (rag === 'a') return '#fffbeb';
    if (rag === 'g') return '#f0fdf4';
    return '#f1f5f9';
  };
  const ragBorder = (rag: string) => {
    if (rag === 'r') return 'rgba(220,38,38,.15)';
    if (rag === 'a') return 'rgba(120,53,15,.12)';
    if (rag === 'g') return 'rgba(20,83,45,.12)';
    return 'rgba(100,116,139,.2)';
  };

  const targetMttc = Math.max(1, Number(r.slaMTTCTarget) || 24);
  const currentMttc = Math.max(0, Number(r.slaMTTC) || 0);
  const slaOk = currentMttc <= targetMttc;
  const slaCompliance = Math.min(100, Math.round((targetMttc / Math.max(currentMttc, 0.1)) * 100));
  const hasActions = recommendations.length > 0 || challenges.length > 0;
  const hasKpiComment = typeof r.kpiComment === 'string' && r.kpiComment.trim().length > 0;

  const sectionDefinitions: SectionDefinition[] = [
    { id: 'exec', title: 'الملخص التنفيذي', rag: finalScore >= 75 ? 'g' : finalScore >= 50 ? 'a' : 'r', visible: true },
    { id: 'eff', title: 'الكفاءة التشغيلية', rag: 'a', visible: effKPIs.length > 0 },
    { id: 'risks', title: 'المخاطر الرئيسية', rag: critRisks === 0 ? 'g' : critRisks <= 2 ? 'a' : 'r', visible: true },
    { id: 'sps', title: 'مؤشرات وضع الأمان', rag: finalScore >= 75 ? 'g' : finalScore >= 50 ? 'a' : 'r', visible: true },
    { id: 'ind', title: 'مؤشرات الأداء', rag: r.kpiCompliance >= 75 ? 'g' : r.kpiCompliance >= 55 ? 'a' : 'r', visible: true },
    { id: 'sla', title: 'مقاييس الاستجابة', rag: slaOk ? 'g' : 'r', visible: r.showSLA },
    { id: 'act', title: 'التوصيات والاعتمادات', rag: hasActions ? 'g' : 'n', visible: true },
    { id: 'mat', title: 'تقييم مستوى الامتثال', rag: avgMatValue >= 80 ? 'g' : avgMatValue >= 60 ? 'a' : 'r', visible: r.showMaturity && maturityDomains.length > 0 },
  ];

  const visibleSections = sectionDefinitions.filter((section) => section.visible);
  const sectionNumberMap = new Map<SectionId, number>();
  visibleSections.forEach((section, index) => sectionNumberMap.set(section.id, index + 1));
  const secNum = (id: SectionId) => sectionNumberMap.get(id) ?? 0;

  const toc = visibleSections.map((section) => ({
    num: secNum(section.id),
    title: section.title,
    rag: section.rag,
  }));

  const kpiChartData = [
    { label: 'حوادث حرجة', previous: r.prevCritical, current: r.kpiCritical },
    { label: 'ثغرات مكتشفة', previous: r.prevVuln, current: r.kpiVuln },
    { label: 'إجمالي الحوادث', previous: r.prevTotal, current: r.kpiTotal },
    { label: 'امتثال ISO%', previous: r.prevCompliance, current: r.kpiCompliance },
  ];

  const SH = (id: SectionId, title: string, rag?: string) => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
      <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: '#94a3b8', minWidth: 28 }}>{String(secNum(id)).padStart(2, '0')}</span>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', flex: 1, letterSpacing: -0.2 }}>{title}</h2>
      {rag && (
        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 9, fontWeight: 800, letterSpacing: 0.5, padding: '3px 10px', borderRadius: 2, background: ragBg(rag), color: ragColor(rag), border: `1px solid ${ragBorder(rag)}` }}>
          {ragLabel(rag)}
        </span>
      )}
    </div>
  );

  return (
    <div className="report-page bg-white shadow-xl" dir="rtl">
      {/* ═══════ COVER PAGE ═══════ */}
      <div id="search-preview-section-general" className="report-cover" style={{ background: 'linear-gradient(160deg,#f8fdf5 0%,#f0f8ed 35%,#fdf8ec 70%,#fffcf0 100%)', color: '#1a3a1f', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', border: '1px solid #c8dfc0', boxSizing: 'border-box', margin: 0, padding: 0 }}>
        <div className="report-cover-decoration" style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 15% 80%,rgba(26,92,46,.06) 0%,transparent 50%),radial-gradient(circle at 85% 20%,rgba(201,162,39,.07) 0%,transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 6, height: '100%', background: 'linear-gradient(180deg,#1a5c2e 0%,#c9a227 55%,rgba(201,162,39,.15) 100%)' }} />
        <div className="report-cover-decoration" style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(26,92,46,.04)', top: -80, left: -80, pointerEvents: 'none', zIndex: 1 }} />
        <div className="report-cover-decoration" style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(201,162,39,.05)', bottom: 80, right: -50, pointerEvents: 'none', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 2, padding: '18px 40px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {r.logoBase64 ? <img src={r.logoBase64} alt="شعار" style={{ maxHeight: 46, maxWidth: 170, objectFit: 'contain' }} /> : <div style={{ fontSize: 10, color: '#1a5c2e', border: '1px solid rgba(26,92,46,.25)', padding: '5px 12px', borderRadius: 8, letterSpacing: 0.4, background: 'rgba(255,255,255,.8)', fontWeight: 700 }}>{r.orgName}</div>}
          </div>
          <div style={{ border: '1px solid rgba(26,92,46,.3)', borderRadius: 20, padding: '4px 12px', fontSize: 8, fontWeight: 800, letterSpacing: 1.2, color: '#1a5c2e', background: 'rgba(26,92,46,.06)' }}>{r.classification}</div>
        </div>
        <div style={{ height: '920px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'center', padding: '52px 44px 214px', boxSizing: 'border-box', overflow: 'hidden' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3.2, color: '#1a5c2e', opacity: 0.78, textTransform: 'uppercase', marginBottom: 12 }}>Information Security Report</div>
          <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.06, letterSpacing: -1.8, marginBottom: 8, color: '#1a3a1f' }}>تقرير أمن المعلومات<br /><span style={{ color: '#c9a227', fontSize: 44 }}>{r.period}</span></div>
          <div style={{ fontSize: 11, color: '#5a7a5e', marginBottom: 14, letterSpacing: 0.5 }}>{dateF}</div>
          <div style={{ width: 260, height: 1.8, background: 'linear-gradient(90deg,transparent,#c9a227,rgba(26,92,46,.4),transparent)', margin: '0 auto 22px' }} />

          <div style={{ fontSize: 10, color: '#5a7a5e', marginBottom: 3 }}>مُعدّ ومقدَّم إلى</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1a3a1f', marginBottom: 3 }}>{r.recipientName}</div>
          <div style={{ fontSize: 11, color: '#5a7a5e', marginBottom: 12 }}>{r.orgName}</div>
          {r.subject && (
            <div style={{ marginTop: 10, width: '100%', maxWidth: 640, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', position: 'relative', borderRadius: 16, padding: '11px 14px 12px', background: 'linear-gradient(135deg,rgba(255,255,255,.86),rgba(240,248,237,.94))', border: '1px solid rgba(26,92,46,.18)', boxShadow: '0 10px 24px rgba(26,92,46,.08), inset 0 1px 0 rgba(255,255,255,.55)' }}>
                <div style={{ fontSize: 9, letterSpacing: 1.8, color: '#6b8f71', textTransform: 'uppercase', marginBottom: 6 }}>الموضوع</div>
                <div style={{ width: 160, height: 1.5, margin: '0 auto 7px', background: 'linear-gradient(90deg,transparent,rgba(201,162,39,.9),transparent)' }} />
                <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.8, color: '#1a3a1f', background: 'rgba(255,255,255,.68)', border: '1px solid rgba(26,92,46,.12)', borderRadius: 11, padding: '9px 12px' }}>
                  {renderFormattedText(r.subject, {
                    fontSize: 17,
                    lineHeight: 1.8,
                    color: '#1a3a1f',
                    fontWeight: 900,
                    gap: 6,
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        {r.chairNote && (
          <div
            style={{
              position: 'absolute',
              zIndex: 2,
              left: '40px',
              right: '40px',
              bottom: '84px',
              border: '1px solid rgba(26,92,46,.15)',
              borderRadius: 10,
              padding: '10px 12px',
              background: 'rgba(244,250,240,.92)',
              pageBreakInside: 'avoid',
            }}
          >
            <div style={{ fontSize: 8, letterSpacing: 1.4, color: '#6b8f71', marginBottom: 6, fontWeight: 700 }}>
              كلمة رئيس مجلس الإدارة / كبار المسؤولين
            </div>
            <div style={{ maxHeight: 116, overflow: 'hidden' }}>
              {renderFormattedText(r.chairNote, {
                fontSize: 11,
                lineHeight: 1.75,
                color: '#2d4a31',
                gap: 4,
              })}
            </div>
          </div>
        )}

        <div style={{ position: 'absolute', zIndex: 2, left: '40px', right: '40px', bottom: '12px', borderTop: '1px solid rgba(26,92,46,.12)', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,.6)', pageBreakInside: 'avoid' }}>
          <div style={{ fontSize: 9, color: '#5a7a5e', lineHeight: 1.6 }}>مقدَّم من<br /><strong style={{ color: '#1a3a1f', fontSize: '10px' }}>{r.author}</strong></div>
          <div style={{ fontSize: 8, color: '#8aaa8e', fontFamily: 'monospace' }}>v{r.version} · {dateF}</div>
        </div>
      </div>


{/* ═══════ TOC ═══════ */}

      <div className="report-toc" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '24px 44px', boxSizing: 'border-box' }}>

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase' }}>فهرس التقرير — الحالة الراهنة</div>

        <div className="report-toc-body">
        <table className="report-preview-table w-full border-collapse text-[10px]">

          <tbody>

            {toc.map((s, i) => (

              <tr key={i} style={{ background: i % 2 === 1 ? '#fff' : 'transparent' }}>

                <td style={{ padding: '7px 12px', borderBottom: '1px solid #e2e8f0', fontFamily: 'monospace', fontWeight: 700, color: '#94a3b8' }}>{String(s.num).padStart(2, '0')}</td>

                <td style={{ padding: '7px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, flex: 1 }}>{s.title}</td>

                <td style={{ padding: '7px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>

                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: ragColor(s.rag) }} />

                </td>

                <td style={{ padding: '7px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 9, fontWeight: 700, color: ragColor(s.rag) }}>{ragLabel(s.rag)}</td>

              </tr>

            ))}

          </tbody>

        </table>
        </div>

        <div className="report-toc-legend" style={{ display: 'flex', gap: 20, marginTop: 'auto', fontSize: 9, color: '#94a3b8', paddingTop: 16 }}>

          <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#dc2626', marginRight: 4 }} /> يستوجب تدخلاً فورياً</span>

          <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', marginRight: 4 }} /> يستوجب متابعة</span>

          <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e', marginRight: 4 }} /> وضع جيد</span>

        </div>

      </div>






      

      {/* ═══════ EXEC SUMMARY ═══════ */}
      <div id="search-preview-section-executive" className="report-section px-11 py-8 border-b border-gray-100">
        {SH('exec', 'الملخص التنفيذي', finalScore >= 75 ? 'g' : finalScore >= 50 ? 'a' : 'r')}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, marginBottom: 18, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
            <div style={{ background: '#1e293b', color: '#fff', borderRadius: 4, padding: '18px 22px', textAlign: 'center', minWidth: 110 }}>
              <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: -2, color: scoreColor(finalScore) }}>{finalScore}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>/ 100</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', marginTop: 7, paddingTop: 7, borderTop: '1px solid rgba(255,255,255,.1)' }}>{finalScore >= 75 ? 'وضع جيد' : finalScore >= 50 ? 'يستوجب الانتباه' : 'خطر مرتفع'}</div>
              {typeof r.scorePercentile === 'number' && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.65)', marginTop: 6 }}>
                  {getPercentileText(r.scorePercentile)}
                </div>
              )}
            </div>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 2, fontSize: 10, fontWeight: 700, background: trendUp ? '#f0fdf4' : trendDown ? '#fef2f2' : '#f1f5f9', color: trendUp ? '#16a34a' : trendDown ? '#dc2626' : '#94a3b8' }}>
              {trendUp ? '↑' : trendDown ? '↓' : '→'} {r.trend}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              {([
                { label: 'حوادث حرجة', val: r.kpiCritical, prev: r.prevCritical, color: '#dc2626', lower: true },
                { label: 'ثغرات مكتشفة', val: r.kpiVuln, prev: r.prevVuln, color: '#d97706', lower: true },
                { label: 'إجمالي الحوادث', val: r.kpiTotal, prev: r.prevTotal, color: '#1e293b', lower: true },
                { label: 'امتثال ISO', val: r.kpiCompliance, prev: r.prevCompliance, color: '#2563eb', lower: false, suffix: '%' },
              ] as Array<{ label: string; val: number; prev: number; color: string; lower: boolean; suffix?: string }>).map((kpi) => {
                const info = getDeltaInfo(kpi.val, kpi.prev, kpi.lower);
                const isGood = info.colorClass.includes('success');
                const isBad = info.colorClass.includes('danger');
                return (
                  <div key={kpi.label} style={{ background: '#fff', padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, marginBottom: 2, color: kpi.color }}>{kpi.val}{kpi.suffix ?? ''}</div>
                    <div style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600, marginBottom: 3 }}>{kpi.label}</div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 2, background: isGood ? '#f0fdf4' : isBad ? '#fef2f2' : '#f1f5f9', color: isGood ? '#16a34a' : isBad ? '#dc2626' : '#94a3b8' }}>{info.arrow} {info.label}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.9 }}>
              {renderFormattedText(r.summary, {
                fontSize: 11,
                lineHeight: 1.9,
                color: '#475569',
                gap: 8,
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ EFFICIENCY ═══════ */}
      {effKPIs.length > 0 && (
        <div id="search-preview-section-efficiency" className="report-section px-11 py-8 border-b border-gray-100">
          {SH('eff', 'الكفاءة التشغيلية', 'a')}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, effKPIs.length)},1fr)`, gap: 1, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            {effKPIs.map((e) => {
              const good = e.lowerBetter ? e.val <= e.target : e.val >= e.target;
              const pct = Math.min(100, Math.round((Math.abs(e.val) / Math.max(e.target, 1)) * 100));
              const mc = good ? '#16a34a' : '#dc2626';
              return (
                <div id={`search-preview-efficiency-${e.id}`} key={e.id} style={{ background: '#fff', padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>{e.title}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 8px', borderRadius: 2, background: good ? '#f0fdf4' : '#fef2f2', color: mc }}>{good ? 'ضمن الهدف' : 'دون الهدف'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, fontFamily: 'monospace', color: mc }}>{formatMetricValue(e.val)}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{e.unit}</span>
                  </div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 6 }}>الهدف: {formatMetricValue(e.target)} {e.unit}</div>
                  <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: mc }} /></div>
                  {e.description && (
                    <div style={{ marginTop: 6 }}>
                      {renderFormattedText(e.description, {
                        fontSize: 9,
                        color: '#94a3b8',
                        lineHeight: 1.7,
                        gap: 4,
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════ RISKS ═══════ */}
      <div id="search-preview-section-risks" className="report-section px-11 py-8 border-b border-gray-100" style={{ pageBreakBefore: 'always', pageBreakAfter: 'always' }}>
        {SH('risks', 'المخاطر الرئيسية', critRisks === 0 ? 'g' : critRisks <= 2 ? 'a' : 'r')}
        {critRisks > 0 && (
          <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.9, padding: '9px 13px', background: '#eff6ff', borderRight: '3px solid #2563eb', marginBottom: 14, borderRadius: '0 3px 3px 0' }}>
            {critRisks} مخاطر بدرجة 15 أو أعلى — تهديد مباشر لاستمرارية الأعمال يستوجب المعالجة قبل نهاية الربع.
          </div>
        )}
        {sortedRisks.length === 0 ? (
          <div style={{ border: '1px dashed #cbd5e1', borderRadius: 6, padding: '18px 14px', fontSize: 11, color: '#64748b', background: '#f8fafc' }}>
            لا توجد مخاطر مدخلة في هذا التقرير حالياً.
          </div>
        ) : (
          <div className="report-table-wrapper overflow-x-auto">
            <table className="report-preview-table w-full border-collapse text-[11px] mb-4 min-w-[760px]">
          <thead>
            <tr>{['#', 'وصف المخاطرة والنظام المتأثر', 'الخطورة', 'الحالة', 'الدرجة', 'السيناريو الأسوأ', 'الضوابط المطلوبة', 'الاصول الحيوية المتاثرة'].map(h => (
              <th key={h} style={{ background: '#1e293b', color: '#fff', padding: '9px 12px', textAlign: 'right', fontWeight: 600, fontSize: 9, letterSpacing: 0.5 }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {sortedRisks.map((risk, i) => {
              const score = risk.probability * risk.impact;
              const sev = SEVERITY_MAP[(risk.severity || 'medium').toLowerCase()] || SEVERITY_MAP.medium;
              const st = STATUS_MAP[(risk.status || 'open').toLowerCase()] || STATUS_MAP.open;
              const autoWC = score >= 20 ? 'توقف العمليات 48+ ساعة وخسائر مالية مباشرة' : score >= 15 ? 'اختراق بيانات وتبعات قانونية' : score >= 10 ? 'تعطل جزئي يؤثر على الإنتاجية' : 'تأثير محدود يمكن احتواؤه';
              return (
                <tr id={`search-preview-risk-${risk.id}`} key={risk.id} style={{ background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 9, fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: risk.system ? 4 : 0 }}>
                      {renderFormattedText(risk.description, {
                        fontSize: 11,
                        color: '#0f172a',
                        fontWeight: 600,
                        lineHeight: 1.7,
                        gap: 4,
                      })}
                    </div>
                    {risk.system ? (
                      <div>
                        {renderFormattedText(risk.system, {
                          fontSize: 9,
                          color: '#94a3b8',
                          lineHeight: 1.6,
                          gap: 3,
                          emptyText: '',
                        })}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${sev?.bgClass}`}>{sev?.label}</span></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${st?.bgClass}`}>{st?.label}</span></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 3, fontSize: 10, fontWeight: 900, fontFamily: 'monospace', background: score >= 20 ? '#450a0a' : score >= 15 ? '#fef2f2' : score >= 10 ? '#fffbeb' : '#f0fdf4', color: score >= 20 ? '#fff' : score >= 15 ? '#dc2626' : score >= 10 ? '#d97706' : '#16a34a' }}>{score}</span>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 10, color: score >= 15 ? '#dc2626' : score >= 10 ? '#d97706' : '#94a3b8', fontWeight: score >= 15 ? 700 : 400, lineHeight: 1.8 }}>
                    {renderFormattedText(risk.worstCase || autoWC, {
                      fontSize: 10,
                      color: score >= 15 ? '#dc2626' : score >= 10 ? '#d97706' : '#94a3b8',
                      fontWeight: score >= 15 ? 700 : 400,
                      lineHeight: 1.8,
                      gap: 4,
                    })}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 10, color: '#475569', lineHeight: 1.8 }}>
                    {renderFormattedText(risk.requiredControls, {
                      fontSize: 10,
                      color: '#475569',
                      lineHeight: 1.8,
                      emptyText: '–',
                      gap: 4,
                    })}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 10, color: '#475569', lineHeight: 1.8 }}>
                    {renderFormattedText(risk.affectedAssets, {
                      fontSize: 10,
                      color: '#475569',
                      lineHeight: 1.8,
                      emptyText: '–',
                      gap: 4,
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
          </div>
        )}
      </div>

      {/* ═══════ SPS DOMAINS ═══════ */}
      <div id="search-preview-section-sps" className="report-section px-11 py-8 border-b border-gray-100" style={{ background: '#f9fcff' }}>
        {SH('sps', 'مؤشرات وضع الأمان', finalScore >= 75 ? 'g' : finalScore >= 50 ? 'a' : 'r')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, padding: '12px 14px' }}>
            <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 4 }}>درجة الأمان الإجمالية</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: scoreColor(finalScore), fontFamily: 'monospace' }}>{finalScore}/100</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, padding: '12px 14px' }}>
            <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 4 }}>عدد المجالات</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>{spsDomains.length}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, padding: '12px 14px' }}>
            <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 4 }}>التصنيف</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: finalScore >= 80 ? '#15803d' : finalScore >= 60 ? '#a16207' : '#b91c1c' }}>
              {finalScore >= 90 ? 'ممتاز' : finalScore >= 80 ? 'قوي' : finalScore >= 70 ? 'متوسط' : finalScore >= 60 ? 'دون المتوسط' : 'حرج'}
            </div>
          </div>
        </div>

        <div className="report-table-wrapper overflow-x-auto">
          <table className="report-preview-table w-full border-collapse text-[11px] min-w-[700px]">
            <thead>
              <tr>{['#', 'المجال', 'الوزن', 'درجة المجال', 'المساهمة', 'المقاييس الفرعية'].map((h) => (
                <th key={h} style={{ background: '#1e293b', color: '#fff', padding: '9px 12px', textAlign: 'right', fontWeight: 600, fontSize: 9, letterSpacing: 0.5 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {domainResults.map((d, i) => (
                <tr key={d.id} style={{ background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 9, fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>{d.nameAr}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontFamily: 'monospace' }}>{Math.round(d.domainWeight * 100)}%</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${d.domainScore}%`, height: '100%', background: d.domainScore >= 75 ? '#16a34a' : d.domainScore >= 50 ? '#d97706' : '#dc2626' }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', minWidth: 34 }}>{d.domainScore}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{d.domainContribution}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 9 }}>
                    {spsDomains.find((x) => x.id === d.id)?.subMetrics.map((sm) => (
                      <span key={sm.id} style={{ display: 'inline-block', marginLeft: 6 }}>{sm.nameAr}: <strong>{sm.value}</strong></span>
                    ))}
                    {d.usedNeutralDefault && <span style={{ color: '#a16207' }}> (قيم محايدة)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════ INDICATORS (KPIs + Benchmark) ═══════ */}
      <div id="search-preview-section-kpi" className="report-section px-11 py-8 border-b border-gray-100">
        {SH('ind', 'مؤشرات الأداء', r.kpiCompliance >= 75 ? 'g' : r.kpiCompliance >= 55 ? 'a' : 'r')}
        <div className="report-table-wrapper overflow-x-auto">
          <table className="report-preview-table w-full border-collapse text-[11px] mb-3 min-w-[640px]">
          <thead>
            <tr>{['المؤشر', 'الفترة السابقة', 'الفترة الحالية', 'التغيير'].map(h => (
              <th key={h} style={{ background: '#1e293b', color: '#fff', padding: '9px 12px', textAlign: 'right', fontWeight: 600, fontSize: 9, letterSpacing: 0.5 }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            <tr><td colSpan={4} style={{ background: '#f8fafc', fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, padding: '6px 12px' }}>مؤشرات الحوادث والامتثال</td></tr>
            {([
              { label: 'الحوادث الحرجة', prev: r.prevCritical, cur: r.kpiCritical, lower: true },
              { label: 'الثغرات المكتشفة', prev: r.prevVuln, cur: r.kpiVuln, lower: true },
              { label: 'إجمالي الحوادث', prev: r.prevTotal, cur: r.kpiTotal, lower: true },
              { label: 'امتثال ISO 27001', prevStr: `${r.prevCompliance}%`, curStr: `${r.kpiCompliance}%`, prev: r.prevCompliance, cur: r.kpiCompliance, lower: false },
            ] as Array<{ label: string; prev: number; cur: number; lower: boolean; prevStr?: string; curStr?: string }>).map((row, i) => {
              const info = getDeltaInfo(row.cur, row.prev, row.lower);
              const g = info.colorClass.includes('success'); const b = info.colorClass.includes('danger');
              return (
                <tr key={row.label} style={{ background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>{row.label}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontFamily: 'monospace' }}>{row.prevStr ?? row.prev}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontFamily: 'monospace' }}>{row.curStr ?? row.cur}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 2, background: g ? '#f0fdf4' : b ? '#fef2f2' : '#f1f5f9', color: g ? '#16a34a' : b ? '#dc2626' : '#94a3b8' }}>{info.arrow} {info.label}</span></td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>

        {/* KPI Combo Chart */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ background: '#f8fafc', padding: '9px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#1e293b' }}>مقارنة المؤشرات — الفترة الحالية vs السابقة</span>
            <div style={{ display: 'flex', gap: 14 }}>
              {([['#cbd5e1', 'الفترة السابقة'], ['#1e3a5f', 'الفترة الحالية']] as [string, string][]).map(([col, lbl]) => (
                <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: '#94a3b8' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: col, display: 'inline-block' }} />{lbl}</span>
              ))}
            </div>
          </div>
          <div style={{ padding: '12px 16px 6px', background: '#fff', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpiChartData} margin={{ top: 10, right: 8, bottom: 12, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(148,163,184,0.14)' }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                />
                <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="previous" name="الفترة السابقة" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" name="الفترة الحالية" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vuln + Incidents mini-block */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ background: '#fff', padding: '14px 16px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 }}>توزيع الثغرات</div>
            {([['حرجة', r.vulnCritical, '#dc2626'], ['عالية', r.vulnHigh, '#d97706'], ['متوسطة', r.vulnMedium, '#ca8a04'], ['منخفضة', r.vulnLow, '#16a34a']] as [string, number, string][]).map(([lbl, val, col]) => (
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <div style={{ fontSize: 10, minWidth: 50, color: '#475569' }}>{lbl}</div>
                <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${Math.round(val / totalVuln * 100)}%`, height: '100%', borderRadius: 2, background: col }} /></div>
                <div style={{ fontSize: 10, fontWeight: 700, minWidth: 20, fontFamily: 'monospace' }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', padding: '14px 16px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 }}>حالة الحوادث</div>
            {([['مفتوحة', r.incOpen, '#dc2626'], ['قيد المعالجة', r.incProgress, '#d97706'], ['مغلقة', r.incClosed, '#16a34a'], ...(r.incWatch > 0 ? [['مراقبة', r.incWatch, '#2563eb']] : [])] as [string, number, string][]).map(([lbl, val, col]) => (
              <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #e2e8f0', fontSize: 10 }}>
                <span style={{ color: '#475569' }}>{lbl}</span>
                <span style={{ fontWeight: 800, fontFamily: 'monospace', color: col }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {hasKpiComment && (
          <div style={{ marginTop: 12, border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '9px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 10, fontWeight: 800, color: '#1e293b' }}>
              تعليق على النتائج
            </div>
            <div style={{ padding: '12px 16px', background: '#fff' }}>
              {renderFormattedText(r.kpiComment, {
                fontSize: 11,
                lineHeight: 1.9,
                color: '#475569',
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══════ SLA ═══════ */}
      {r.showSLA && (
        <div id="search-preview-section-sla" className="report-section px-11 py-8 border-b border-gray-100" style={{ background: '#f8fafc' }}>
          {SH('sla', 'مقاييس الاستجابة', slaOk ? 'g' : 'r')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 4 }}>MTTC الحالي</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: slaOk ? '#15803d' : '#b91c1c', fontFamily: 'monospace' }}>{formatMetricValue(currentMttc)}<span style={{ fontSize: 12, marginRight: 4 }}>ساعة</span></div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 4 }}>الهدف المعتمد</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>{formatMetricValue(targetMttc)}<span style={{ fontSize: 12, marginRight: 4 }}>ساعة</span></div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 4 }}>الالتزام بالهدف</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: slaCompliance >= 90 ? '#15803d' : slaCompliance >= 70 ? '#a16207' : '#b91c1c', fontFamily: 'monospace' }}>{slaCompliance}%</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 4 }}>خروقات SLA</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: r.slaBreach > 0 ? '#b91c1c' : '#15803d', fontFamily: 'monospace' }}>{r.slaBreach}</div>
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: 4, border: `1px solid ${slaOk ? '#bbf7d0' : '#fecaca'}`, background: slaOk ? '#f0fdf4' : '#fef2f2', fontSize: 11, color: '#475569', lineHeight: 1.9 }}>
            {slaOk
              ? 'زمن الاحتواء الحالي ضمن الحد المستهدف، مما يدعم جاهزية الاستجابة التشغيلية.'
              : 'زمن الاحتواء أعلى من الهدف المعتمد، ويوصى برفع الأتمتة التشغيلية وخطط الاحتواء السريع.'}
            {typeof r.slaRate === 'number' && r.slaRate > 0 && (
              <span style={{ fontWeight: 700, color: '#0f172a' }}> معدل الالتزام المسجل: {formatMetricValue(r.slaRate)}%</span>
            )}
          </div>
        </div>
      )}


      {/* ═══════ ACTIONS (Recs + Challenges merged) ═══════ */}
      <div id="search-preview-section-actions" className="report-section px-11 py-8 border-b border-gray-100">
        {SH('act', 'التوصيات والاعتمادات')}
        {!hasActions ? (
          <div style={{ border: '1px dashed #cbd5e1', borderRadius: 6, padding: '18px 14px', fontSize: 11, color: '#64748b', background: '#f8fafc' }}>
            لا توجد توصيات أو تحديات حالياً.
          </div>
        ) : (
          <div className="report-table-wrapper overflow-x-auto">
            <table className="report-preview-table w-full border-collapse text-[11px] min-w-[680px]">
          <thead>
            <tr>{['#', 'التوصية / الاعتماد', 'الأولوية / النوع', 'صاحب القرار'].map(h => (
              <th key={h} style={{ background: '#1e293b', color: '#fff', padding: '9px 12px', textAlign: 'right', fontWeight: 600, fontSize: 9, letterSpacing: 0.5 }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {recommendations.length > 0 && (
              <tr><td colSpan={4} style={{ background: '#f8fafc', fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, padding: '6px 12px' }}>توصيات تشغيلية</td></tr>
            )}
            {recommendations.map((rec, i) => {
              const pri = PRIORITY_MAP[rec.priority];
              return (
                <tr id={`search-preview-recommendation-${rec.id}`} key={rec.id} style={{ background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 9, fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3 }}>{rec.title}</div>
                    <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.8 }}>
                      {renderFormattedText(rec.description, {
                        fontSize: 10,
                        color: '#475569',
                        lineHeight: 1.8,
                        emptyText: '—',
                        gap: 4,
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${pri?.bgClass}`}>{pri?.label}</span></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>{rec.owner ? <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 2, background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>{rec.owner}</span> : '—'}</td>
                </tr>
              );
            })}
            {challenges.length > 0 && (
              <tr><td colSpan={4} style={{ background: '#fffbeb', fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, padding: '6px 12px' }}>اعتمادات استراتيجية تستوجب قراراً من الإدارة</td></tr>
            )}
            {challenges.map((chal, i) => {
              const ct = CHALLENGE_TYPES[chal.type] || CHALLENGE_TYPES.tech;
              return (
                <tr id={`search-preview-challenge-${chal.id}`} key={chal.id} style={{ background: '#fffbeb' }}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 9, fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace' }}>{String.fromCharCode(65 + i)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3 }}>{chal.title}</div>
                    <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.8 }}>
                      {renderFormattedText(chal.rootCause, {
                        fontSize: 10,
                        color: '#475569',
                        lineHeight: 1.8,
                        emptyText: '—',
                        gap: 4,
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${ct.bgClass}`}>{ct.label}</span></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 10, color: '#2563eb', fontWeight: 700 }}>{chal.requirement}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
          </div>
        )}
      </div>

      {/* ═══════ MATURITY ═══════ */}
      {r.showMaturity && maturityDomains.length > 0 && (
        <div id="search-preview-section-maturity" className="report-section px-11 py-8 border-b border-gray-100" style={{ background: '#f8fafc' }}>
          {SH('mat', 'تقييم مستوى الامتثال — ملحق تقييمي', avgMatValue >= 80 ? 'g' : avgMatValue >= 60 ? 'a' : 'r')}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14, padding: '12px 16px', background: '#fff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>متوسط الامتثال</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', fontFamily: 'monospace' }}>{avgMat}<span style={{ fontSize: 12, color: '#94a3b8' }}> %</span></div>
            </div>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>{avgMatValue >= 85 ? 'امتثال ممتاز' : avgMatValue >= 70 ? 'امتثال جيد' : avgMatValue >= 50 ? 'امتثال متوسط' : 'يحتاج تحسيناً'}</span>
          </div>
          <div style={{ background: '#fff', borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 14 }}>
            {maturityDomains.map((domain) => (
              <div id={`search-preview-maturity-${domain.id}`} key={domain.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, flex: 1 }}>{domain.name}</div>
                <div style={{ width: 180, height: 6, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${domain.score}%`, height: '100%', borderRadius: 2, background: domain.score >= 85 ? '#15803d' : domain.score >= 70 ? '#16a34a' : domain.score >= 50 ? '#d97706' : '#dc2626' }} /></div>
                <div style={{ fontSize: 10, fontWeight: 700, minWidth: 86, color: '#475569', fontFamily: 'monospace' }}>{domain.score}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ FOOTER ═══════ */}
      <div className="report-footer" style={{ background: '#1e293b', color: 'rgba(255,255,255,.45)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 44px', fontSize: 9, flexWrap: 'wrap', gap: 6, fontFamily: 'monospace' }}>
        <span><strong style={{ color: 'rgba(255,255,255,.75)' }}>{r.classification}</strong> · للمستلم المحدد فقط</span>
        <span>{r.orgName} · {r.author}</span>
        <span>{dateF} · v{r.version}</span>
      </div>
    </div>
  );
}