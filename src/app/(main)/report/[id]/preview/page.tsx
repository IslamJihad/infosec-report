'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ReportData } from '@/types/report';
import { fetchReport } from '@/lib/api';
import { buildReportSearchIndex, searchReportIndex, type ReportSearchResult } from '@/lib/search/reportSearch';
import ReportPreview from '@/components/report/ReportPreview';
import ReportSearchDropdown from '@/components/search/ReportSearchDropdown';
import Link from 'next/link';

export default function ReportPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchReport(id);
        setReport(data);
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

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
      <div className="min-h-screen flex items-center justify-center bg-[#dde2eb]">
        <div className="text-center">
          <div className="text-4xl animate-spin inline-block mb-3">⚙️</div>
          <p className="text-text-muted text-sm">جاري تحميل التقرير...</p>
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
