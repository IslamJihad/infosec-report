'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { ReportData } from '@/types/report';
import { fetchReport } from '@/lib/api';
import { buildReportSearchIndex, searchReportIndex, type ReportSearchResult } from '@/lib/search/reportSearch';
import ReportPreview from '@/components/report/ReportPreview';
import ReportSearchDropdown from '@/components/search/ReportSearchDropdown';
import Link from 'next/link';

export default function ReportPreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadReport = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchReport(id);
      setReport(data);
    } catch (error) {
      console.error('Failed to load preview report:', error);
      setReport(null);
      setLoadError('تعذر تحميل التقرير. يرجى إعادة المحاولة.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable = Boolean(target && (target.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select'));

      if (isEditable) return;

      if (event.key === '/') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const searchIndex = useMemo(() => {
    if (!report) return [];
    return buildReportSearchIndex(report, 'preview');
  }, [report]);

  const searchResults = useMemo(() => searchReportIndex(searchIndex, searchQuery), [searchIndex, searchQuery]);

  const highlightTarget = useCallback((targetId: string) => {
    const target = document.getElementById(targetId);
    if (!target) return false;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.remove('search-highlight-pulse');
    void target.getBoundingClientRect();
    target.classList.add('search-highlight-pulse');
    window.setTimeout(() => target.classList.remove('search-highlight-pulse'), 2200);
    return true;
  }, []);

  const handleSearchSelect = useCallback(
    (result: ReportSearchResult) => {
      setSearchOpen(false);

      if (!highlightTarget(result.targetId)) {
        highlightTarget(result.sectionTargetId);
      }
    },
    [highlightTarget],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#dde2eb] px-4 py-8">
        <div className="max-w-[900px] mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-[68px] bg-slate-200/80 animate-pulse" />
          <div className="h-[900px] bg-gradient-to-b from-slate-100 to-white animate-pulse" />
          <div className="p-4 text-center text-sm text-slate-500">جاري تحميل التقرير...</div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#dde2eb] px-4">
        <div className="w-full max-w-[560px] rounded-2xl border border-red-200 bg-white shadow-xl p-6 text-center" dir="rtl">
          <div className="text-2xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">تعذر فتح المعاينة</h2>
          <p className="text-sm text-slate-600 mb-5">{loadError}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => void loadReport()}
              className="bg-navy-800 text-white border-none rounded-lg px-4 py-2 text-sm font-bold hover:bg-navy-900 transition-colors cursor-pointer"
            >
              إعادة المحاولة
            </button>
            <Link
              href={`/report/${id}`}
              className="bg-white text-navy-900 border border-navy-200 rounded-lg px-4 py-2 text-sm font-bold no-underline hover:bg-navy-50 transition-colors"
            >
              الرجوع للمحرر
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-[#dde2eb]">
      {/* Toolbar */}
      <div className="no-print bg-navy-950 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-[900px] mx-auto flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Link href={`/report/${id}`} className="text-white/60 hover:text-white transition-colors text-[11px] no-underline">
              → الرجوع للمحرر
            </Link>
            <span className="text-white/20">|</span>
            <Link href="/" className="text-white/60 hover:text-white transition-colors text-[11px] no-underline">
              لوحة التقارير
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => {
                  if (searchOpen) {
                    setSearchOpen(false);
                    return;
                  }
                  setSearchOpen(true);
                }}
                className="bg-white text-navy-900 border-none rounded-md px-3.5 py-1.5 text-[11px] font-[Cairo] font-bold hover:bg-navy-100 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                🔍 بحث
              </button>

              <ReportSearchDropdown
                isOpen={searchOpen}
                query={searchQuery}
                results={searchResults}
                onQueryChange={setSearchQuery}
                onSelect={handleSearchSelect}
                onClose={() => setSearchOpen(false)}
              />
            </div>

            {searchQuery.trim().length >= 2 && (
              <span className="text-[11px] text-white/75 px-2 py-1 rounded-md bg-white/10">
                {searchResults.length} نتيجة
              </span>
            )}

            <button
              onClick={() => window.print()}
              className="bg-success-700 text-white border-none rounded-md px-3.5 py-1.5 text-[11px] font-[Cairo] font-bold hover:bg-green-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              🖨️ طباعة / تصدير PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report */}
      <div className="py-6">
        <ReportPreview report={report} />
      </div>
    </div>
  );
}
