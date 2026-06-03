'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ReportData } from '@/types/report';
import { fetchReports, createReport, deleteReport, duplicateReport } from '@/lib/api';
import { getScoreColorClass } from '@/lib/constants';
import Link from 'next/link';
import AppSwitcher from '@/components/isms/AppSwitcher';
import ThemeToggle from '@/components/theme/ThemeToggle';

function getMissingCoreFieldsCount(report: ReportData): number {
  const requiredValues = [
    report.orgName,
    report.recipientName,
    report.subject,
    report.period,
    report.issueDate,
    report.author,
  ];

  return requiredValues.filter((value) => !value.trim()).length;
}

function formatRelativeTimeArabic(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'غير متاح';

  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const formatter = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });

  if (absMs < 60_000) return 'الآن';
  if (absMs < 3_600_000) return formatter.format(Math.round(diffMs / 60_000), 'minute');
  if (absMs < 86_400_000) return formatter.format(Math.round(diffMs / 3_600_000), 'hour');
  if (absMs < 2_592_000_000) return formatter.format(Math.round(diffMs / 86_400_000), 'day');
  return formatter.format(Math.round(diffMs / 2_592_000_000), 'month');
}

type StatusFilter = 'all' | 'draft' | 'published';
type SortOption = 'updated' | 'scoreDesc' | 'scoreAsc' | 'name';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'updated', label: 'الأحدث تعديلاً' },
  { value: 'scoreDesc', label: 'الأعلى درجة أمن' },
  { value: 'scoreAsc', label: 'الأقل درجة أمن' },
  { value: 'name', label: 'اسم المنظمة (أ-ي)' },
];

export default function DashboardPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const router = useRouter();

  const pendingDeleteReport = reports.find((report) => report.id === pendingDeleteId) || null;

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (!pendingDeleteId) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPendingDeleteId(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [pendingDeleteId]);

  async function loadReports() {
    try {
      const data = await fetchReports();
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      const report = await createReport();
      router.push(`/report/${report.id}`);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      setDeleteError(null);
    } catch (e) {
      console.error(e);
      setDeleteError('تعذر حذف التقرير. حاول مرة أخرى.');
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const dup = await duplicateReport(id);
      setReports((prev) => [dup, ...prev]);
    } catch (e) {
      console.error(e);
    }
  }

  const totalReports = reports.length;
  const avgScore = totalReports > 0 ? Math.round(reports.reduce((a, r) => a + r.securityScore, 0) / totalReports) : 0;
  const totalRisks = reports.reduce((a, r) => a + r.risks.length, 0);

  const draftCount = useMemo(() => reports.filter((r) => r.status === 'draft').length, [reports]);
  const publishedCount = totalReports - draftCount;

  const visibleReports = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = reports.filter((r) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'draft' ? r.status === 'draft' : r.status !== 'draft');
      if (!matchesStatus) return false;

      if (!term) return true;
      return [r.orgName, r.subject, r.author, r.period, r.recipientName, r.securityLevel]
        .some((value) => value?.toLowerCase().includes(term));
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case 'scoreDesc':
        sorted.sort((a, b) => b.securityScore - a.securityScore);
        break;
      case 'scoreAsc':
        sorted.sort((a, b) => a.securityScore - b.securityScore);
        break;
      case 'name':
        sorted.sort((a, b) => (a.orgName || '').localeCompare(b.orgName || '', 'ar'));
        break;
      case 'updated':
      default:
        sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
    }
    return sorted;
  }, [reports, searchTerm, statusFilter, sortBy]);

  const isFiltering = searchTerm.trim() !== '' || statusFilter !== 'all';

  function resetFilters() {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('updated');
  }

  return (
    <div className="min-h-screen [background:var(--page-main-bg)] animate-fadeIn">
      {/* Header */}
      <header className="bg-gradient-to-l from-navy-950 via-navy-900 to-navy-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 18% 50%, #4a90d9 0%, transparent 48%), radial-gradient(circle at 82% 50%, #1a5298 0%, transparent 48%)' }} />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-navy-500/40 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-navy-600 to-navy-800 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-navy-900/50 ring-1 ring-white/10">
              🛡️
            </div>
            <div>
              <h1 className="text-2xl font-[900] leading-tight tracking-tight">نظام تقارير أمن المعلومات</h1>
              <p className="text-sm opacity-60 mt-1">النسخة الاحترافية – إدارة أمن المعلومات</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div style={{ direction: 'ltr' }}>
              <AppSwitcher />
            </div>

            <div style={{ direction: 'ltr' }}>
              <ThemeToggle compact />
            </div>

            <Link href="/analytics" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl px-4 md:px-5 py-2.5 text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 no-underline backdrop-blur-sm">
              📈 التحليلات
            </Link>
            <Link href="/settings" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl px-4 md:px-5 py-2.5 text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 no-underline backdrop-blur-sm">
              ⚙️ الإعدادات
            </Link>
            <button
              onClick={handleCreate}
              className="bg-gradient-to-l from-navy-600 to-navy-700 hover:from-navy-500 hover:to-navy-600 text-white border-none rounded-xl px-5 md:px-6 py-2.5 text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-lg shadow-navy-900/30 animate-pulse-glow"
            >
              + إنشاء تقرير جديد
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-8 -mt-6 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: '📊', label: 'إجمالي التقارير', val: totalReports, color: 'text-navy-800', accent: 'var(--color-navy-600)' },
            { icon: '🛡️', label: 'متوسط درجة الأمن', val: `${avgScore}/100`, color: avgScore >= 70 ? 'text-success-700' : 'text-warning-500', accent: avgScore >= 70 ? 'var(--color-success-500)' : 'var(--color-warning-500)' },
            { icon: '⚠️', label: 'إجمالي المخاطر المفتوحة', val: totalRisks, color: 'text-danger-500', accent: 'var(--color-danger-500)' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="relative bg-[color:var(--surface-elevated)] rounded-2xl border border-border/70 p-6 flex items-center gap-4 shadow-lg shadow-black/5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            >
              <span className="absolute inset-y-0 right-0 w-1.5" style={{ background: stat.accent }} aria-hidden="true" />
              <div className="text-4xl w-14 h-14 flex items-center justify-center bg-[color:var(--surface-muted)] border border-border/60 rounded-xl shadow-sm">{stat.icon}</div>
              <div>
                <div className={`text-3xl font-[900] ${stat.color} leading-none`}>{stat.val}</div>
                <div className="text-sm text-text-secondary mt-1.5 font-semibold">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reports grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {deleteError && (
          <div className="mb-4 rounded-2xl border border-danger-500/30 bg-danger-100 px-4 py-3 text-sm text-danger-700">
            ⚠️ {deleteError}
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="mb-6 flex flex-col lg:flex-row lg:items-center gap-3 bg-[color:var(--surface-elevated)] border border-border/70 rounded-2xl p-3 shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث باسم المنظمة، الموضوع، المُعد..."
                className="w-full border border-border rounded-xl py-2.5 pr-10 pl-9 text-sm bg-[color:var(--surface-muted)] focus:bg-[color:var(--surface-elevated)] outline-none focus:border-navy-600 focus:shadow-[0_0_0_3px_var(--color-focus-ring)] transition-all"
                aria-label="بحث في التقارير"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-sm cursor-pointer"
                  aria-label="مسح البحث"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-[color:var(--surface-muted)] border border-border rounded-xl p-1">
              {([
                { key: 'all', label: 'الكل', count: totalReports },
                { key: 'published', label: 'منشورة', count: publishedCount },
                { key: 'draft', label: 'مسودات', count: draftCount },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setStatusFilter(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === opt.key
                      ? 'bg-[color:var(--surface-elevated)] text-navy-900 shadow-sm'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {opt.label} <span className="opacity-70">({opt.count})</span>
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="border border-border rounded-xl py-2.5 px-3 text-sm bg-[color:var(--surface-muted)] outline-none focus:border-navy-600 cursor-pointer min-w-[160px]"
              aria-label="ترتيب التقارير"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {!loading && reports.length > 0 && isFiltering && (
          <div className="mb-4 -mt-2 text-sm text-text-muted">
            عرض <span className="font-bold text-text-secondary">{visibleReports.length}</span> من {totalReports} تقرير
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" aria-busy="true" aria-label="جاري التحميل">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[color:var(--surface-elevated)] rounded-2xl border border-border/60 overflow-hidden shadow-md">
                <div className="h-[76px] bg-gradient-to-l from-navy-950 to-navy-900 opacity-90" />
                <div className="px-6 py-5 space-y-4">
                  <div className="flex gap-2">
                    <div className="skeleton h-6 w-20 rounded-lg" />
                    <div className="skeleton h-6 w-16 rounded-lg" />
                  </div>
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="skeleton h-10 rounded-xl" />
                    <div className="skeleton h-10 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-24 bg-[color:var(--surface-elevated)] rounded-2xl border border-border shadow-lg">
            <div className="w-24 h-24 bg-[color:var(--surface-muted)] border border-border/60 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-5xl">🛡️</span>
            </div>
            <h2 className="text-2xl font-[800] text-navy-950 mb-3">لا توجد تقارير بعد</h2>
            <p className="text-base text-text-muted mb-6 max-w-md mx-auto">ابدأ بإنشاء أول تقرير أمن معلومات لتتبع مستوى الأمان في مؤسستك</p>
            <button
              onClick={handleCreate}
              className="bg-gradient-to-l from-navy-800 to-navy-900 text-white border-none rounded-xl px-8 py-3.5 text-base font-bold hover:from-navy-700 hover:to-navy-800 transition-all duration-200 cursor-pointer shadow-lg shadow-navy-900/20"
            >
              + إنشاء تقرير جديد
            </button>
          </div>
        ) : visibleReports.length === 0 ? (
          <div className="text-center py-20 bg-[color:var(--surface-elevated)] rounded-2xl border border-border shadow-sm">
            <div className="text-5xl mb-3">🔎</div>
            <h2 className="text-xl font-[800] text-navy-950 mb-2">لا توجد تقارير مطابقة</h2>
            <p className="text-sm text-text-muted mb-5">جرّب تعديل كلمة البحث أو عوامل التصفية.</p>
            <button
              onClick={resetFilters}
              className="bg-navy-50 text-navy-800 border border-navy-200 rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-navy-100 transition-colors cursor-pointer"
            >
              إعادة ضبط عوامل التصفية
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visibleReports.map((r) => {
              const scoreColor = getScoreColorClass(r.securityScore);
              const missingCoreFieldsCount = getMissingCoreFieldsCount(r);

              return (
                <div key={r.id} className="bg-[color:var(--surface-elevated)] rounded-2xl border border-border/60 overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  {/* Card header */}
                  <div className="bg-gradient-to-l from-navy-950 to-navy-900 text-white px-6 py-5 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 0% 100%, #4a90d9 0%, transparent 60%)' }} />
                    <div className="flex-1 min-w-0 relative z-10">
                      <div className="text-base font-bold truncate">{r.orgName}</div>
                      <div className="text-xs opacity-60 mt-0.5">{r.period}</div>
                    </div>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-[900] text-lg border-[3px] flex-shrink-0 ml-3 shadow-md relative z-10 ${scoreColor.ring} ${scoreColor.bg} ${scoreColor.text}`}>
                      {r.securityScore}
                    </div>
                  </div>
                  {/* Card body */}
                  <div className="px-6 py-5">
                    <div className="flex gap-2 flex-wrap mb-4">
                      <span className="text-xs px-3 py-1 rounded-lg bg-navy-100 text-navy-800 font-bold">{r.securityLevel}</span>
                      <span className={`text-xs px-3 py-1 rounded-lg font-bold ${r.status === 'draft' ? 'bg-warning-100 text-warning-700' : 'bg-success-100 text-success-700'}`}>
                        {r.status === 'draft' ? 'مسودة' : 'منشور'}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-lg bg-[color:var(--surface-muted)] border border-border/60 text-text-muted">{r.risks.length} مخاطر</span>
                      {missingCoreFieldsCount > 0 && (
                        <span className="text-xs px-3 py-1 rounded-lg bg-warning-100 text-warning-700 border border-warning-500/30 font-bold">
                          ناقص {missingCoreFieldsCount} حقول أساسية
                        </span>
                      )}
                      {typeof r.scorePercentile === 'number' && (
                        <span className="text-xs px-3 py-1 rounded-lg bg-navy-100 text-navy-800 font-bold border border-navy-200">
                          أعلى من {r.scorePercentile}% من التقارير
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-text-muted mb-4 flex gap-4 flex-wrap">
                      <span>📅 {r.issueDate}</span>
                      <span>👤 {r.author}</span>
                      <span>🕒 {formatRelativeTimeArabic(r.updatedAt)}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] gap-2">
                      <Link
                        href={`/report/${r.id}`}
                        className="flex-1 bg-gradient-to-l from-navy-800 to-navy-900 text-white border-none rounded-xl py-2.5 text-center text-sm font-bold hover:from-navy-700 hover:to-navy-800 transition-all duration-200 no-underline shadow-sm"
                      >
                        ✏️ تعديل
                      </Link>
                      <Link
                        href={`/report/${r.id}/preview`}
                        className="flex-1 bg-gradient-to-l from-success-700 to-green-800 text-white border-none rounded-xl py-2.5 text-center text-sm font-bold hover:from-green-600 hover:to-green-700 transition-all duration-200 no-underline shadow-sm"
                      >
                        👁️ معاينة
                      </Link>
                      <button
                        onClick={() => handleDuplicate(r.id)}
                        className="w-full md:w-auto bg-navy-50 text-navy-800 border border-navy-200 rounded-xl py-2.5 px-3.5 text-sm hover:bg-navy-100 transition-all duration-200 cursor-pointer"
                        title="نسخ التقرير"
                        aria-label="نسخ التقرير"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => setPendingDeleteId(r.id)}
                        className="w-full md:w-auto bg-danger-100 text-danger-500 border border-danger-500/30 rounded-xl py-2.5 px-3.5 text-sm hover:brightness-95 transition-all duration-200 cursor-pointer"
                        title="حذف التقرير"
                        aria-label="حذف التقرير"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pendingDeleteReport && (
        <div
          className="fixed inset-0 z-[120] bg-navy-950/55 backdrop-blur-[2px] flex items-center justify-center px-4"
          onClick={() => setPendingDeleteId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-[color:var(--surface-elevated)] shadow-2xl p-5 animate-fadeIn"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-[900] text-navy-950 mb-2">تأكيد حذف التقرير</h3>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              سيتم حذف تقرير <strong>{pendingDeleteReport.orgName || 'بدون اسم'}</strong> بشكل نهائي. لا يمكن التراجع بعد التأكيد.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="flex-1 rounded-xl border border-border bg-surface-muted text-text-primary py-2.5 text-sm font-bold hover:bg-navy-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  void handleDelete(pendingDeleteReport.id);
                }}
                className="flex-1 rounded-xl border border-danger-500/30 bg-danger-100 text-danger-700 py-2.5 text-sm font-bold hover:brightness-95 transition-all"
              >
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center text-sm text-text-muted py-6 border-t border-border/40">
        © {new Date().getFullYear()} إدارة أمن المعلومات – النسخة الاحترافية v5.0
      </footer>
    </div>
  );
}
