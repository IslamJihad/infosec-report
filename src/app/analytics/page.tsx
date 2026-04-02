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
import { fetchAnalytics } from '@/lib/api';
import { formatArabicDate, getDeltaInfo, PRIORITY_MAP, SEVERITY_MAP, STATUS_MAP } from '@/lib/constants';
import type {
  AnalyticsGroupBy,
  AnalyticsQueryOptions,
  AnalyticsResponse,
  AnalyticsRiskSeverity,
  AnalyticsRiskStatus,
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
  alert: 'bg-danger-100 border-red-200 text-danger-700',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  success: 'bg-green-50 border-green-200 text-green-800',
} as const;

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

  function openReport(reportIdValue: string) {
    router.push(`/report/${reportIdValue}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8edf4] via-[#dce4f0] to-[#c8d6e8]">
      <header className="bg-gradient-to-l from-navy-950 via-navy-900 to-navy-950 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-navy-600 to-navy-800 rounded-2xl flex items-center justify-center text-2xl shadow-lg">📈</div>
            <div>
              <h1 className="text-xl md:text-2xl font-[900]">لوحة التحليلات الأمنية</h1>
              <p className="text-sm opacity-60 mt-0.5">تحليل شامل لمحفظة تقارير أمن المعلومات</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
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
              className="bg-gray-100 text-text-secondary rounded-xl px-4 py-2.5 text-sm font-bold border border-gray-200 cursor-pointer"
            >
              إعادة ضبط
            </button>
          </div>
        </section>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-border/60 shadow-md">
            <div className="text-5xl animate-spin inline-block mb-3">⚙️</div>
            <p className="text-text-muted">جاري تحميل التحليلات...</p>
          </div>
        ) : error ? (
          <div className="bg-danger-100 text-danger-700 border border-red-200 rounded-2xl p-5 font-bold">
            {error}
          </div>
        ) : !analytics ? (
          <div className="bg-white border border-border rounded-2xl p-6 text-text-muted">لا توجد بيانات متاحة.</div>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-border/60 p-5 shadow-md">
                <div className="text-xs text-text-secondary font-bold">إجمالي التقارير</div>
                <div className="text-3xl font-[900] text-navy-900 mt-2">{formatArabicNumber(analytics.summary.totalReports)}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl border border-border/60 p-5 shadow-md">
                <div className="text-xs text-text-secondary font-bold">متوسط درجة الأمن</div>
                <div className="text-3xl font-[900] text-success-700 mt-2">{formatArabicNumber(analytics.summary.avgSecurityScore)} / 100</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl border border-border/60 p-5 shadow-md">
                <div className="text-xs text-text-secondary font-bold">المخاطر المفتوحة</div>
                <div className="text-3xl font-[900] text-danger-700 mt-2">{formatArabicNumber(analytics.summary.openRisks)}</div>
                <div className="text-xs text-text-muted mt-2">من أصل {formatArabicNumber(analytics.summary.totalRisks)} مخاطر</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-border/60 p-5 shadow-md">
                <div className="text-xs text-text-secondary font-bold">تغطية ISO الإجمالية</div>
                <div className="text-3xl font-[900] text-warning-700 mt-2">{formatArabicNumber(analytics.overallIsoCoverage)}%</div>
                {complianceDelta && (
                  <div className={`inline-flex mt-2 px-2.5 py-1 rounded-lg text-xs font-bold ${complianceDelta.colorClass}`}>
                    {complianceDelta.arrow} {formatArabicNumber(complianceDelta.delta)}
                  </div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-border/60 p-5 shadow-md">
                <h2 className="text-base font-[900] text-navy-900 mb-4">اتجاه درجة الأمن حسب تاريخ التقارير</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e6ebf5" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
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
                        <Tooltip />
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
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
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
          <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-2xl p-4">
            لا توجد تقارير ضمن النطاق المحدد. جرّب توسيع التاريخ أو زيادة عدد التقارير.
          </div>
        )}
      </main>
    </div>
  );
}