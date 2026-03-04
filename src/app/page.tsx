'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ReportData } from '@/types/report';
import { fetchReports, createReport, deleteReport, duplicateReport } from '@/lib/api';
import { getScoreColorClass } from '@/lib/constants';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gradient-to-br from-[#e8edf4] to-[#d0dae8]">
      {/* Header */}
      <header className="bg-navy-950 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🛡️</div>
            <div>
              <h1 className="text-lg font-[900] leading-tight">نظام تقارير أمن المعلومات</h1>
              <p className="text-[10px] opacity-50 mt-0.5">النسخة الاحترافية – إدارة أمن المعلومات</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings" className="bg-white/10 text-white border-none rounded-md px-3 py-1.5 text-[11px] font-[Cairo] font-bold hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-1.5 no-underline">
              ⚙️ الإعدادات
            </Link>
            <button
              onClick={handleCreate}
              className="bg-navy-600 text-white border-none rounded-md px-4 py-2 text-[12px] font-[Cairo] font-bold hover:bg-navy-700 transition-colors cursor-pointer flex items-center gap-1.5 animate-pulse-glow"
            >
              + إنشاء تقرير جديد
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 -mt-1">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '📊', label: 'إجمالي التقارير', val: totalReports, color: 'text-navy-800' },
            { icon: '🛡️', label: 'متوسط درجة الأمن', val: `${avgScore}/100`, color: avgScore >= 70 ? 'text-success-700' : 'text-warning-500' },
            { icon: '⚠️', label: 'إجمالي المخاطر المفتوحة', val: totalRisks, color: 'text-danger-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg border border-border p-4 flex items-center gap-3 shadow-sm">
              <div className="text-2xl">{stat.icon}</div>
              <div>
                <div className={`text-xl font-[900] ${stat.color}`}>{stat.val}</div>
                <div className="text-[10px] text-text-muted">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reports grid */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-16">
            <div className="text-3xl animate-spin inline-block mb-3">⚙️</div>
            <p className="text-text-muted text-sm">جاري التحميل...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-border">
            <div className="text-5xl mb-3">🛡️</div>
            <h2 className="text-lg font-[800] text-navy-950 mb-2">لا توجد تقارير بعد</h2>
            <p className="text-sm text-text-muted mb-4">ابدأ بإنشاء أول تقرير أمن معلومات</p>
            <button
              onClick={handleCreate}
              className="bg-navy-800 text-white border-none rounded-lg px-6 py-2.5 text-[13px] font-[Cairo] font-bold hover:bg-navy-900 transition-colors cursor-pointer"
            >
              + إنشاء تقرير جديد
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reports.map((r) => {
              const scoreColor = getScoreColorClass(r.securityScore);
              return (
                <div key={r.id} className="bg-white rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                  <div className="bg-navy-950 text-white px-4 py-2.5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold truncate">{r.orgName}</div>
                      <div className="text-[9px] opacity-50">{r.period}</div>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-[900] text-sm border-2 flex-shrink-0 ml-2 ${scoreColor.ring} ${scoreColor.bg} ${scoreColor.text}`}>
                      {r.securityScore}
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap mb-2.5">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-navy-100 text-navy-800 font-bold">{r.securityLevel}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${r.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-success-100 text-success-700'}`}>
                        {r.status === 'draft' ? 'مسودة' : 'منشور'}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-gray-100 text-text-muted">{r.risks.length} مخاطر</span>
                    </div>
                    <div className="text-[10px] text-text-muted mb-3 flex gap-3">
                      <span>📅 {r.issueDate}</span>
                      <span>👤 {r.author}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <Link
                        href={`/report/${r.id}`}
                        className="flex-1 bg-navy-800 text-white border-none rounded-md py-1.5 text-center text-[10px] font-[Cairo] font-bold hover:bg-navy-900 transition-colors no-underline"
                      >
                        ✏️ تعديل
                      </Link>
                      <Link
                        href={`/report/${r.id}/preview`}
                        className="flex-1 bg-success-700 text-white border-none rounded-md py-1.5 text-center text-[10px] font-[Cairo] font-bold hover:bg-green-800 transition-colors no-underline"
                      >
                        👁️ معاينة
                      </Link>
                      <button
                        onClick={() => handleDuplicate(r.id)}
                        className="bg-navy-100 text-navy-800 border-none rounded-md py-1.5 px-2.5 text-[10px] font-[Cairo] font-bold hover:bg-navy-200 transition-colors cursor-pointer"
                        title="نسخ التقرير"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="bg-danger-100 text-danger-500 border-none rounded-md py-1.5 px-2.5 text-[10px] font-[Cairo] font-bold hover:bg-red-200 transition-colors cursor-pointer"
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

      <footer className="text-center text-[10px] text-text-muted py-4 border-t border-border/50">
        © {new Date().getFullYear()} إدارة أمن المعلومات – النسخة الاحترافية v5.0
      </footer>
    </div>
  );
}
