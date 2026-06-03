'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchAnalytics, generateAnalyticsSummary } from '@/lib/api';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { formatArabicDate, getDeltaInfo, PRIORITY_MAP, SEVERITY_MAP, STATUS_MAP } from '@/lib/constants';
import type {
  AnalyticsAISummaryResponse,
  AnalyticsGroupBy,
  AnalyticsQueryOptions,
  AnalyticsResponse,
  AnalyticsRiskSeverity,
  AnalyticsRiskStatus,
  AnalyticsSummaryAudience,
} from '@/types/analytics';

const SEVERITY_COLORS: Record<'critical' | 'high' | 'medium' | 'low', string> = {
  critical: '#8b0000',
  high: '#d35400',
  medium: '#b8860b',
  low: '#1b5e20',
};

const GROUP_BY_LABELS: Record<AnalyticsGroupBy, string> = {
  none: 'بدون تجميع',
  severity: 'تجميع حسب الشدة',
  status: 'تجميع حسب الحالة',
  system: 'تجميع حسب النظام',
  organization: 'تجميع حسب الجهة',
};

const INSIGHT_STYLES = {
  alert: 'bg-danger-100 border-danger-500/30 text-danger-700',
  info: 'bg-navy-100 border-navy-200 text-navy-800',
  success: 'bg-success-100 border-success-500/30 text-success-700',
} as const;

const AUDIENCE_LABELS: Record<AnalyticsSummaryAudience, string> = {
  leadership: 'الإدارة التنفيذية',
  board: 'مجلس الإدارة',
  ciso: 'مدير الأمن (CISO)',
};

function buildSummaryQueryHash(query: AnalyticsQueryOptions, audience: AnalyticsSummaryAudience): string {
  return JSON.stringify({
    audience,
    from: query.from || '',
    to: query.to || '',
    limit: query.limit ?? 24,
    groupBy: query.groupBy || 'none',
    riskSeverity: query.riskSeverity || '',
    riskStatus: query.riskStatus || '',
    reportId: query.reportId || '',
  });
}

function formatArabicNumber(value: number): string {
  return new Intl.NumberFormat('ar-EG').format(value);
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState<AnalyticsQueryOptions>({ limit: 24 });
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [limit, setLimit] = useState(24);
  const [groupBy, setGroupBy] = useState<AnalyticsGroupBy>('none');
  const [riskSeverity, setRiskSeverity] = useState<AnalyticsRiskSeverity | ''>('');
  const [riskStatus, setRiskStatus] = useState<AnalyticsRiskStatus | ''>('');
  const [reportId, setReportId] = useState('');
  const [aiAudience, setAiAudience] = useState<AnalyticsSummaryAudience>('leadership');
  const [aiSummary, setAiSummary] = useState<AnalyticsAISummaryResponse | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchAnalytics(query);
        setAnalytics(data);
      } catch (e) {
        console.error(e);
        setError('فشل تحميل بيانات التحليلات. حاول مرة أخرى.');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [query]);

  const trendData = useMemo(() => {
    if (!analytics) return [];
    return analytics.trend.map((point) => ({
      ...point,
      label: formatArabicDate(point.date),
    }));
  }, [analytics]);

  const riskChartData = useMemo(() => {
    if (!analytics) return [];
    return analytics.riskDistribution.map((item) => ({
      ...item,
      label: SEVERITY_MAP[item.severity].label,
      fill: SEVERITY_COLORS[item.severity],
    }));
  }, [analytics]);

  const complianceDelta = analytics
    ? getDeltaInfo(analytics.summary.avgCompliance, analytics.summary.avgPrevCompliance, false)
    : null;

  const activeSummaryQueryHash = useMemo(() => buildSummaryQueryHash(query, aiAudience), [query, aiAudience]);
  const isSummaryStale = !!aiSummary && aiSummary.queryHash !== activeSummaryQueryHash;

  function applyFilters() {
    const next: AnalyticsQueryOptions = {
      limit,
      from: fromDate || undefined,
      to: toDate || undefined,
      groupBy,
      riskSeverity: riskSeverity || undefined,
      riskStatus: riskStatus || undefined,
      reportId: reportId.trim() || undefined,
    };
    setQuery(next);
  }

  function resetFilters() {
    setFromDate('');
    setToDate('');
    setLimit(24);
    setGroupBy('none');
    setRiskSeverity('');
    setRiskStatus('');
    setReportId('');
    setQuery({ limit: 24 });
  }

  async function handleGenerateSummary(forceRefresh = false) {
    setAiSummaryLoading(true);
    setAiSummaryError('');
    setCopyStatus('');

    try {
      const summary = await generateAnalyticsSummary({
        ...query,
        audience: aiAudience,
        forceRefresh,
      });
      setAiSummary(summary);
    } catch (e: unknown) {
      setAiSummaryError((e as Error).message || 'فشل توليد الملخص الذكي');
    } finally {
      setAiSummaryLoading(false);
    }
  }

  async function handleCopySummary() {
    if (!aiSummary?.content) return;

    try {
      await navigator.clipboard.writeText(aiSummary.content);
      setCopyStatus('تم النسخ');
      window.setTimeout(() => setCopyStatus(''), 1400);
    } catch {
      setCopyStatus('تعذر النسخ');
      window.setTimeout(() => setCopyStatus(''), 1400);
    }
  }

  function openReport(reportIdValue: string) {
    router.push(`/report/${reportIdValue}`);
  }

  return (
    <div className="min-h-screen [background:var(--page-main-bg)] animate-fadeIn">
      <header className="bg-gradient-to-l from-navy-950 via-navy-900 to-navy-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-navy-500/40 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-7 flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-navy-600 to-navy-800 rounded-2xl flex items-center justify-center text-2xl shadow-lg ring-1 ring-white/10">📈</div>
            <div>
              <h1 className="text-xl md:text-2xl font-[900]">لوحة التحليلات الأمنية</h1>
              <p className="text-sm opacity-60 mt-0.5">تحليل شامل لمحفظة تقارير أمن المعلومات</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div style={{ direction: 'ltr' }}>
              <ThemeToggle compact />
            </div>
            <Link href="/" className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-2 text-sm font-bold no-underline transition-colors">
              ← لوحة التقارير
            </Link>
            <Link href="/settings" className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-2 text-sm font-bold no-underline transition-colors">
              ⚙️ الإعدادات
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-8 py-7 space-y-6">
        <section className="bg-white rounded-2xl border border-border/60 p-4 md:p-5 shadow-md">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">من تاريخ</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-border rounded-xl px-3 py-2 text-sm bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">إلى تاريخ</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-border rounded-xl px-3 py-2 text-sm bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">عدد التقارير</label>
              <input
                type="number"
                min={1}
                max={120}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) || 24)}
                className="border border-border rounded-xl px-3 py-2 text-sm w-28 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">التجميع</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as AnalyticsGroupBy)}
                className="border border-border rounded-xl px-3 py-2 text-sm bg-white min-w-[170px]"
              >
                <option value="none">بدون تجميع</option>
                <option value="severity">حسب الشدة</option>
                <option value="status">حسب الحالة</option>
                <option value="system">حسب النظام</option>
                <option value="organization">حسب الجهة</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">تصفية الشدة</label>
              <select
                value={riskSeverity}
                onChange={(e) => setRiskSeverity(e.target.value as AnalyticsRiskSeverity | '')}
                className="border border-border rounded-xl px-3 py-2 text-sm bg-white min-w-[150px]"
              >
                <option value="">كل الدرجات</option>
                <option value="critical">حرجة</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">تصفية الحالة</label>
              <select
                value={riskStatus}
                onChange={(e) => setRiskStatus(e.target.value as AnalyticsRiskStatus | '')}
                className="border border-border rounded-xl px-3 py-2 text-sm bg-white min-w-[150px]"
              >
                <option value="">كل الحالات</option>
                <option value="open">مفتوحة</option>
                <option value="inprogress">قيد المعالجة</option>
                <option value="accepted">مقبولة</option>
                <option value="closed">مغلقة</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">معرف تقرير محدد</label>
              <input
                type="text"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                placeholder="اختياري"
                className="border border-border rounded-xl px-3 py-2 text-sm bg-white min-w-[180px]"
              />
            </div>
            <button
              onClick={applyFilters}
              className="bg-gradient-to-l from-navy-800 to-navy-900 text-white rounded-xl px-5 py-2.5 text-sm font-bold border-none cursor-pointer"
            >
              تحديث التحليلات
            </button>
            <button
              onClick={resetFilters}
              className="bg-[color:var(--surface-muted)] text-text-secondary rounded-xl px-4 py-2.5 text-sm font-bold border border-border cursor-pointer hover:bg-[color:var(--button-soft-hover)] transition-colors"
            >
              إعادة ضبط
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-border/60 p-5 shadow-md">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-[900] text-navy-900">الملخص التنفيذي الذكي</h2>
              <p className="text-xs text-text-muted mt-1">تحليل استشاري مبني على نفس بيانات لوحة التحليلات الحالية.</p>
              <span className="inline-flex mt-2 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg px-2.5 py-1 text-[11px] font-bold">
                اقتراحات فقط - بدون أي تنفيذ تلقائي
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={aiAudience}
                onChange={(event) => setAiAudience(event.target.value as AnalyticsSummaryAudience)}
                className="border border-border rounded-xl px-3 py-2 text-sm bg-white min-w-[170px]"
              >
                <option value="leadership">الإدارة التنفيذية</option>
                <option value="board">مجلس الإدارة</option>
                <option value="ciso">مدير الأمن (CISO)</option>
              </select>

              <button
                onClick={() => { void handleGenerateSummary(false); }}
                disabled={aiSummaryLoading || loading}
                className="bg-gradient-to-l from-purple-800 to-purple-900 text-white rounded-xl px-4 py-2 text-sm font-bold border-none cursor-pointer disabled:opacity-60"
              >
                {aiSummaryLoading ? 'جاري التوليد...' : 'توليد الملخص'}
              </button>

              <button
                onClick={() => { void handleGenerateSummary(true); }}
                disabled={aiSummaryLoading || loading || !aiSummary}
                className="bg-white text-navy-900 rounded-xl px-4 py-2 text-sm font-bold border border-border cursor-pointer disabled:opacity-60"
              >
                تحديث
              </button>
            </div>
          </div>

          {aiSummaryError ? (
            <div className="mt-4 bg-danger-100 border border-red-200 text-danger-700 rounded-xl px-3 py-2 text-sm font-bold">
              {aiSummaryError}
            </div>
          ) : null}

          {!aiSummary && !aiSummaryLoading && !aiSummaryError ? (
            <div className="mt-4 bg-surface rounded-xl border border-border/50 p-4 text-sm text-text-muted">
              اختر الجمهور ثم اضغط &quot;توليد الملخص&quot; للحصول على قراءة تنفيذية للبيانات الحالية.
            </div>
          ) : null}

          {aiSummaryLoading ? (
            <div className="mt-4 bg-surface rounded-xl border border-border/50 p-6 text-center">
              <div className="mx-auto w-8 h-8 rounded-full border-[3px] border-[color:var(--color-border)] border-t-navy-600 animate-spin" />
              <p className="text-sm text-text-muted mt-2">جاري إنتاج الملخص الذكي...</p>
            </div>
          ) : null}

          {aiSummary && !aiSummaryLoading ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="bg-purple-50 border border-purple-200 text-purple-900 rounded-lg px-2 py-1 font-bold">{AUDIENCE_LABELS[aiSummary.audience]}</span>
                <span className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg px-2 py-1 font-bold">{aiSummary.provider} / {aiSummary.model}</span>
                <span className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-2 py-1 font-bold">
                  {aiSummary.cacheHit ? 'من الذاكرة المؤقتة' : 'توليد مباشر'}
                </span>
                <span className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-2 py-1 font-bold">
                  {new Date(aiSummary.generatedAt).toLocaleString('ar-SA')}
                </span>
              </div>

              {isSummaryStale ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-3 py-2 text-xs font-bold">
                  الملخص الحالي مبني على مرشحات سابقة. اضغط &quot;تحديث&quot; لمزامنته مع المرشحات الحالية.
                </div>
              ) : null}

              <div className="rounded-xl border border-border/50 bg-surface p-4 text-sm leading-8 text-text-secondary whitespace-pre-wrap">
                {aiSummary.content}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="bg-white border border-border rounded-lg px-3 py-2 text-xs text-text-secondary">تقارير: <span className="font-bold text-navy-900">{formatArabicNumber(aiSummary.keyMetrics.totalReports)}</span></div>
                <div className="bg-white border border-border rounded-lg px-3 py-2 text-xs text-text-secondary">درجة الأمن: <span className="font-bold text-navy-900">{formatArabicNumber(aiSummary.keyMetrics.avgSecurityScore)}</span></div>
                <div className="bg-white border border-border rounded-lg px-3 py-2 text-xs text-text-secondary">مخاطر مفتوحة: <span className="font-bold text-danger-700">{formatArabicNumber(aiSummary.keyMetrics.openRisks)}</span></div>
                <div className="bg-white border border-border rounded-lg px-3 py-2 text-xs text-text-secondary">مخاطر حرجة: <span className="font-bold text-danger-700">{formatArabicNumber(aiSummary.keyMetrics.criticalRisks)}</span></div>
                <div className="bg-white border border-border rounded-lg px-3 py-2 text-xs text-text-secondary">تغطية ISO: <span className="font-bold text-navy-900">{formatArabicNumber(aiSummary.keyMetrics.overallIsoCoverage)}%</span></div>
                <div className="bg-white border border-border rounded-lg px-3 py-2 text-xs text-text-secondary">تغير الامتثال: <span className="font-bold text-navy-900">{formatArabicNumber(aiSummary.keyMetrics.complianceDelta)}</span></div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { void handleCopySummary(); }}
                  className="bg-white text-navy-900 rounded-xl px-3 py-1.5 text-xs font-bold border border-border cursor-pointer"
                >
                  نسخ الملخص
                </button>
                {copyStatus ? <span className="text-xs text-text-muted">{copyStatus}</span> : null}
              </div>
            </div>
          ) : null}
        </section>

        {loading ? (
          <div className="text-center py-20 bg-[color:var(--surface-elevated)] rounded-2xl border border-border/60 shadow-md">
            <div className="mx-auto w-12 h-12 rounded-full border-4 border-[color:var(--color-border)] border-t-navy-600 animate-spin mb-3" />
            <p className="text-text-muted">جاري تحميل التحليلات...</p>
          </div>
        ) : error ? (
          <div className="bg-danger-100 text-danger-700 border border-danger-500/30 rounded-2xl p-5 font-bold">
            {error}
          </div>
        ) : !analytics ? (
          <div className="bg-[color:var(--surface-elevated)] border border-border rounded-2xl p-6 text-text-muted">لا توجد بيانات متاحة.</div>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'إجمالي التقارير', accent: 'var(--color-navy-600)', node: <div className="text-3xl font-[900] text-navy-900 mt-2">{formatArabicNumber(analytics.summary.totalReports)}</div> },
                { label: 'متوسط درجة الأمن', accent: 'var(--color-success-500)', node: <div className="text-3xl font-[900] text-success-700 mt-2">{formatArabicNumber(analytics.summary.avgSecurityScore)} / 100</div> },
                { label: 'المخاطر المفتوحة', accent: 'var(--color-danger-500)', node: <><div className="text-3xl font-[900] text-danger-700 mt-2">{formatArabicNumber(analytics.summary.openRisks)}</div><div className="text-xs text-text-muted mt-2">من أصل {formatArabicNumber(analytics.summary.totalRisks)} مخاطر</div></> },
                { label: 'تغطية ISO الإجمالية', accent: 'var(--color-warning-500)', node: <><div className="text-3xl font-[900] text-warning-700 mt-2">{formatArabicNumber(analytics.overallIsoCoverage)}%</div>{complianceDelta && (<div className={`inline-flex mt-2 px-2.5 py-1 rounded-lg text-xs font-bold ${complianceDelta.colorClass}`}>{complianceDelta.arrow} {formatArabicNumber(complianceDelta.delta)}</div>)}</> },
              ].map((card) => (
                <div key={card.label} className="relative bg-[color:var(--surface-elevated)] rounded-2xl border border-border/60 p-5 shadow-md overflow-hidden">
                  <span className="absolute inset-y-0 right-0 w-1.5" style={{ background: card.accent }} aria-hidden="true" />
                  <div className="text-xs text-text-secondary font-bold">{card.label}</div>
                  {card.node}
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-border/60 p-5 shadow-md">
                <h2 className="text-base font-[900] text-navy-900 mb-4">اتجاه درجة الأمن حسب تاريخ التقارير</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} interval="preserveStartEnd" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                      <Tooltip contentStyle={{ background: 'var(--surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 12, color: 'var(--color-text-primary)' }} />
                      <Line type="monotone" dataKey="securityScore" stroke="#1a5298" strokeWidth={3} dot={{ r: 4 }} name="درجة الأمن" />
                      <Line type="monotone" dataKey="compliance" stroke="#1b5e20" strokeWidth={2} dot={{ r: 3 }} name="الامتثال" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border/60 p-5 shadow-md">
                <h2 className="text-base font-[900] text-navy-900 mb-4">توزيع المخاطر حسب الشدة</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskChartData}
                          dataKey="count"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={45}
                          paddingAngle={2}
                        >
                          {riskChartData.map((entry) => (
                            <Cell key={entry.severity} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 12, color: 'var(--color-text-primary)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {riskChartData.map((item) => (
                      <div key={item.severity} className="flex items-center justify-between bg-surface rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                          <span className="text-sm font-bold text-text-secondary">{item.label}</span>
                        </div>
                        <span className="text-sm font-[900] text-navy-900">{formatArabicNumber(item.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {analytics.insights.map((insight) => (
                <div
                  key={`${insight.type}-${insight.title}`}
                  className={`rounded-2xl border p-4 shadow-sm ${INSIGHT_STYLES[insight.type]}`}
                >
                  <div className="text-sm font-[900] mb-1">{insight.title}</div>
                  <div className="text-xs leading-6">{insight.message}</div>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl border border-border/60 p-4 shadow-md">
                <div className="text-xs text-text-secondary font-bold">إشارات المخاطر الحديثة (30 يوم)</div>
                <div className="text-2xl font-[900] text-navy-900 mt-2">{formatArabicNumber(analytics.velocity.recentRiskSignals)}</div>
              </div>
              <div className="bg-white rounded-2xl border border-border/60 p-4 shadow-md">
                <div className="text-xs text-text-secondary font-bold">المخاطر النشطة</div>
                <div className="text-2xl font-[900] text-danger-700 mt-2">{formatArabicNumber(analytics.velocity.activeRisks)}</div>
              </div>
              <div className="bg-white rounded-2xl border border-border/60 p-4 shadow-md">
                <div className="text-xs text-text-secondary font-bold">المخاطر المغلقة</div>
                <div className="text-2xl font-[900] text-success-700 mt-2">{formatArabicNumber(analytics.velocity.closedRisks)}</div>
              </div>
              <div className="bg-white rounded-2xl border border-border/60 p-4 shadow-md">
                <div className="text-xs text-text-secondary font-bold">معدل الإغلاق</div>
                <div className="text-2xl font-[900] text-navy-900 mt-2">{formatArabicNumber(analytics.velocity.closureRate)}%</div>
              </div>
              <div className="bg-white rounded-2xl border border-border/60 p-4 shadow-md">
                <div className="text-xs text-text-secondary font-bold">التعرض الحرج</div>
                <div className="text-2xl font-[900] text-warning-700 mt-2">{formatArabicNumber(analytics.velocity.criticalExposure)}%</div>
              </div>
            </section>

            {analytics.grouped.dimension !== 'none' && analytics.grouped.items.length > 0 && (
              <section className="bg-white rounded-2xl border border-border/60 p-5 shadow-md overflow-x-auto">
                <h2 className="text-base font-[900] text-navy-900 mb-4">{GROUP_BY_LABELS[analytics.grouped.dimension]}</h2>
                <table className="w-full min-w-[620px] border-collapse">
                  <thead>
                    <tr className="text-xs text-text-muted border-b border-border/70">
                      <th className="py-2 text-right">البند</th>
                      <th className="py-2 text-center">إجمالي المخاطر</th>
                      <th className="py-2 text-center">المخاطر المفتوحة</th>
                      <th className="py-2 text-center">متوسط درجة الخطر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.grouped.items.map((item) => (
                      <tr key={item.key} className="border-b border-border/50">
                        <td className="py-2.5 text-sm font-semibold text-navy-900">{item.label}</td>
                        <td className="py-2.5 text-center text-sm text-text-secondary">{formatArabicNumber(item.count)}</td>
                        <td className="py-2.5 text-center text-sm text-danger-700 font-bold">{formatArabicNumber(item.openCount)}</td>
                        <td className="py-2.5 text-center text-sm font-[900] text-navy-900">{formatArabicNumber(item.avgScore)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-border/60 p-5 shadow-md overflow-x-auto">
                <h2 className="text-base font-[900] text-navy-900 mb-4">أعلى المخاطر (حسب الاحتمالية × التأثير)</h2>
                <table className="w-full min-w-[640px] border-collapse">
                  <thead>
                    <tr className="text-xs text-text-muted border-b border-border/70">
                      <th className="py-2 text-right">التقرير</th>
                      <th className="py-2 text-right">النظام</th>
                      <th className="py-2 text-right">الوصف</th>
                      <th className="py-2 text-center">الدرجة</th>
                      <th className="py-2 text-center">الشدة</th>
                      <th className="py-2 text-center">الحالة</th>
                      <th className="py-2 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topRisks.map((risk, index) => (
                      <tr
                        key={`${risk.reportId}-${index}-${risk.score}`}
                        className="border-b border-border/50 hover:bg-navy-50/40 cursor-pointer transition-colors"
                        onClick={() => openReport(risk.reportId)}
                      >
                        <td className="py-2.5 text-sm font-semibold text-navy-900">{risk.reportName}</td>
                        <td className="py-2.5 text-sm text-text-muted">{risk.system || 'غير محدد'}</td>
                        <td className="py-2.5 text-sm text-text-secondary">{risk.description || '—'}</td>
                        <td className="py-2.5 text-center text-sm font-[900] text-navy-900">{formatArabicNumber(risk.score)}</td>
                        <td className="py-2.5 text-center">
                          <span className={`text-xs px-2.5 py-1 rounded-lg ${SEVERITY_MAP[risk.severity].bgClass}`}>
                            {SEVERITY_MAP[risk.severity].label}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`text-xs px-2.5 py-1 rounded-lg ${STATUS_MAP[risk.status].bgClass}`}>
                            {STATUS_MAP[risk.status].label}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <Link
                            href={`/report/${risk.reportId}`}
                            onClick={(event) => event.stopPropagation()}
                            className="text-xs font-bold text-navy-800 hover:text-navy-900 no-underline"
                          >
                            فتح ←
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-2xl border border-border/60 p-5 shadow-md">
                <h2 className="text-base font-[900] text-navy-900 mb-4">تغطية ISO 27001 حسب المجال</h2>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {analytics.isoCoverage.map((domain) => (
                    <div key={domain.domainId} className="bg-surface border border-border/40 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-bold text-navy-900">{domain.domainId} - {domain.domainName}</div>
                        <div className="text-xs font-[900] text-text-secondary">{formatArabicNumber(domain.coverage)}%</div>
                      </div>
                      <div className="mt-2 bg-white rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-l from-navy-700 to-navy-500"
                          style={{ width: `${Math.min(100, Math.max(0, domain.coverage))}%` }}
                        />
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        الضوابط المطبقة {formatArabicNumber(domain.applied)} من {formatArabicNumber(domain.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-border/60 p-5 shadow-md">
              <h2 className="text-base font-[900] text-navy-900 mb-4">مقارنة سريعة لمؤشرات المخاطر</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6ebf5" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                    <Tooltip contentStyle={{ background: 'var(--surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 12, color: 'var(--color-text-primary)' }} cursor={{ fill: 'var(--surface-muted)' }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {riskChartData.map((item) => (
                        <Cell key={`bar-${item.severity}`} fill={item.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-border/60 p-5 shadow-md">
              <h2 className="text-base font-[900] text-navy-900 mb-2">ملخص التحسين مقارنة بالفترة السابقة</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-surface rounded-xl border border-border/40 p-3">
                  <div className="text-xs text-text-muted mb-1">متوسط الامتثال الحالي</div>
                  <div className="text-lg font-[900] text-navy-900">{formatArabicNumber(analytics.summary.avgCompliance)}%</div>
                </div>
                <div className="bg-surface rounded-xl border border-border/40 p-3">
                  <div className="text-xs text-text-muted mb-1">متوسط الامتثال السابق</div>
                  <div className="text-lg font-[900] text-text-secondary">{formatArabicNumber(analytics.summary.avgPrevCompliance)}%</div>
                </div>
                <div className="bg-surface rounded-xl border border-border/40 p-3">
                  <div className="text-xs text-text-muted mb-1">صافي التغير</div>
                  <div className={`inline-flex px-2.5 py-1 rounded-lg text-sm font-bold ${complianceDelta?.colorClass ?? PRIORITY_MAP.medium.bgClass}`}>
                    {complianceDelta ? `${complianceDelta.arrow} ${formatArabicNumber(complianceDelta.delta)}` : '—'}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {!loading && !error && analytics?.trend.length === 0 && (
          <div className="bg-warning-100 text-warning-700 border border-warning-500/30 rounded-2xl p-4">
            لا توجد تقارير ضمن النطاق المحدد. جرّب توسيع التاريخ أو زيادة عدد التقارير.
          </div>
        )}
      </main>
    </div>
  );
}