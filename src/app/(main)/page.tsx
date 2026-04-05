'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ReportData } from '@/types/report';
import { fetchReports, createReport, deleteReport, duplicateReport } from '@/lib/api';
import { getScoreColorClass } from '@/lib/constants';
import Link from 'next/link';
import AppSwitcher from '@/components/isms/AppSwitcher';

export default function DashboardPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadReports();
  }, []);

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
    if (!confirm('هل أنت متأكد من حذف هذا التقرير؟')) return;
    await deleteReport(id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleDuplicate(id: string) {
    const dup = await duplicateReport(id);
    setReports((prev) => [dup, ...prev]);
  }

  const totalReports = reports.length;
  const avgScore = totalReports > 0 ? Math.round(reports.reduce((a, r) => a + r.securityScore, 0) / totalReports) : 0;
  const totalRisks = reports.reduce((a, r) => a + r.risks.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8edf4] via-[#dce4f0] to-[#c8d6e8]">
      {/* Header */}
      <header className="bg-gradient-to-l from-navy-950 via-navy-900 to-navy-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #4a90d9 0%, transparent 50%), radial-gradient(circle at 80% 50%, #1a5298 0%, transparent 50%)' }} />
        <div className="max-w-7xl mx-auto px-8 py-8 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-navy-600 to-navy-800 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-navy-900/50">
              🛡️
            </div>
            <div>
              <h1 className="text-2xl font-[900] leading-tight tracking-tight">نظام تقارير أمن المعلومات</h1>
              <p className="text-sm opacity-60 mt-1">النسخة الاحترافية – إدارة أمن المعلومات</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ direction: 'ltr' }}>
              <AppSwitcher />
            </div>

            <Link href="/analytics" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 no-underline backdrop-blur-sm">
              📈 التحليلات
            </Link>
            <Link href="/settings" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 no-underline backdrop-blur-sm">
              ⚙️ الإعدادات
            </Link>
            <button
              onClick={handleCreate}
              className="bg-gradient-to-l from-navy-600 to-navy-700 hover:from-navy-500 hover:to-navy-600 text-white border-none rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-lg shadow-navy-900/30 animate-pulse-glow"
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
            { icon: '📊', label: 'إجمالي التقارير', val: totalReports, color: 'text-navy-800', gradient: 'from-blue-50 to-white' },
            { icon: '🛡️', label: 'متوسط درجة الأمن', val: `${avgScore}/100`, color: avgScore >= 70 ? 'text-success-700' : 'text-warning-500', gradient: avgScore >= 70 ? 'from-green-50 to-white' : 'from-orange-50 to-white' },
            { icon: '⚠️', label: 'إجمالي المخاطر المفتوحة', val: totalRisks, color: 'text-danger-500', gradient: 'from-red-50 to-white' },
          ].map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.gradient} rounded-2xl border border-white/80 p-6 flex items-center gap-4 shadow-lg shadow-black/5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}>
              <div className="text-4xl w-14 h-14 flex items-center justify-center bg-white rounded-xl shadow-sm">{stat.icon}</div>
              <div>
                <div className={`text-3xl font-[900] ${stat.color} leading-none`}>{stat.val}</div>
                <div className="text-sm text-text-secondary mt-1 font-semibold">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reports grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {loading ? (
          <div className="text-center py-24">
            <div className="text-5xl animate-spin inline-block mb-4">⚙️</div>
            <p className="text-text-muted text-lg">جاري التحميل...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-border shadow-lg">
            <div className="w-24 h-24 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-5">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {reports.map((r) => {
              const scoreColor = getScoreColorClass(r.securityScore);
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  {/* Card header */}
                  <div className="bg-gradient-to-l from-navy-950 to-navy-900 text-white px-6 py-5 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 0% 100%, #4a90d9 0%, transparent 60%)' }} />
                    <div className="flex-1 min-w-0 relative z-10">
                      <div className="text-base font-bold truncate">{r.orgName}</div>
                      <div className="text-xs opacity-60 mt-0.5">{r.period}</div>
                    </div>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-[900] text-lg border-3 flex-shrink-0 ml-3 shadow-md relative z-10 ${scoreColor.ring} ${scoreColor.bg} ${scoreColor.text}`}>
                      {r.securityScore}
                    </div>
                  </div>
                  {/* Card body */}
                  <div className="px-6 py-5">
                    <div className="flex gap-2 flex-wrap mb-4">
                      <span className="text-xs px-3 py-1 rounded-lg bg-navy-100 text-navy-800 font-bold">{r.securityLevel}</span>
                      <span className={`text-xs px-3 py-1 rounded-lg font-bold ${r.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-success-100 text-success-700'}`}>
                        {r.status === 'draft' ? 'مسودة' : 'منشور'}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-lg bg-gray-100 text-text-muted">{r.risks.length} مخاطر</span>
                      {typeof r.scorePercentile === 'number' && (
                        <span className="text-xs px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-100">
                          أعلى من {r.scorePercentile}% من التقارير
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-text-muted mb-4 flex gap-4">
                      <span>📅 {r.issueDate}</span>
                      <span>👤 {r.author}</span>
                    </div>
                    <div className="flex gap-2">
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
                        className="bg-navy-50 text-navy-800 border border-navy-200 rounded-xl py-2.5 px-3.5 text-sm hover:bg-navy-100 transition-all duration-200 cursor-pointer"
                        title="نسخ التقرير"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="bg-red-50 text-danger-500 border border-red-200 rounded-xl py-2.5 px-3.5 text-sm hover:bg-red-100 transition-all duration-200 cursor-pointer"
                        title="حذف التقرير"
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

      <footer className="text-center text-sm text-text-muted py-6 border-t border-border/40">
        © {new Date().getFullYear()} إدارة أمن المعلومات – النسخة الاحترافية v5.0
      </footer>
    </div>
  );
}
