'use client';

import { useReportStore } from '@/store/reportStore';
import { NAV_ITEMS } from '@/lib/constants';
import ReportSearchDropdown from '@/components/search/ReportSearchDropdown';
import type { ReportSearchResult } from '@/lib/search/reportSearch';

interface TopBarSearchProps {
  isOpen: boolean;
  query: string;
  results: ReportSearchResult[];
  onToggle: () => void;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onSelect: (result: ReportSearchResult) => void;
}

interface TopBarProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onPreview: () => void;
  onAIReview: () => void;
  onGoHome: () => void;
  search?: TopBarSearchProps;
}

export default function TopBar({ currentStep, onStepChange, onPreview, onAIReview, onGoHome, search }: TopBarProps) {
  const { isSaving, lastSaved } = useReportStore();

  const title = NAV_ITEMS[currentStep]?.label || '';

  return (
    <div className="bg-white/90 backdrop-blur-lg border-b border-border py-3.5 px-6 flex items-center justify-between sticky top-0 z-40 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <h1 className="text-lg font-[800] text-navy-950">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Save status */}
        <span className="text-xs text-text-muted ml-3">
          {isSaving ? (
            <span className="flex items-center gap-1.5">
              <span className="animate-spin text-sm">⏳</span> جاري الحفظ...
            </span>
          ) : lastSaved ? (
            <span className="text-success-700 font-semibold">✓ تم الحفظ</span>
          ) : null}
        </span>

        {search && (
          <div className="relative">
            <button
              onClick={() => {
                if (search.isOpen) {
                  search.onClose();
                  return;
                }
                search.onToggle();
              }}
              className="py-2 px-4 rounded-xl border border-navy-200 bg-white text-navy-900 text-sm font-bold transition-all duration-200 hover:bg-navy-50 cursor-pointer flex items-center gap-1.5"
            >
              🔍 بحث
            </button>

            <ReportSearchDropdown
              isOpen={search.isOpen}
              query={search.query}
              results={search.results}
              onQueryChange={search.onQueryChange}
              onSelect={search.onSelect}
              onClose={search.onClose}
            />
          </div>
        )}

        <button
          onClick={onGoHome}
          className="py-2 px-5 rounded-xl border border-navy-200 bg-navy-50 text-navy-900 text-sm font-bold transition-all duration-200 hover:bg-navy-100 cursor-pointer"
        >
          🏠 الرئيسية
        </button>

        <button
          onClick={() => onStepChange(currentStep - 1)}
          disabled={currentStep === 0}
          className="py-2 px-5 rounded-xl border border-border bg-white text-navy-800 text-sm font-bold transition-all duration-200 hover:bg-navy-50 hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          → السابق
        </button>

        <button
          onClick={() => onStepChange(currentStep + 1)}
          disabled={currentStep >= NAV_ITEMS.length - 1}
          className="py-2 px-5 rounded-xl border-none bg-gradient-to-l from-navy-800 to-navy-900 text-white text-sm font-bold transition-all duration-200 hover:from-navy-700 hover:to-navy-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
        >
          التالي ←
        </button>

        <button
          onClick={onAIReview}
          className="py-2 px-5 rounded-xl border-none bg-gradient-to-l from-purple-800 to-purple-900 text-white text-sm font-bold transition-all duration-200 hover:from-purple-700 hover:to-purple-800 cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          🤖 مراجعة AI
        </button>

        <button
          onClick={onPreview}
          className="py-2 px-5 rounded-xl border-none bg-gradient-to-l from-success-700 to-green-800 text-white text-sm font-bold transition-all duration-200 hover:from-green-600 hover:to-green-700 cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          🖨️ إنشاء التقرير
        </button>
      </div>
    </div>
  );
}
