'use client';

import { useReportStore } from '@/store/reportStore';
import { NAV_ITEMS } from '@/lib/constants';
import ReportSearchDropdown from '@/components/search/ReportSearchDropdown';
import AppSwitcher from '@/components/isms/AppSwitcher';
import ThemeToggle from '@/components/theme/ThemeToggle';
import type { ReportSearchResult } from '@/lib/search/reportSearch';

interface TopBarSearchProps {
  isOpen: boolean;
  query: string;
  results: ReportSearchResult[];
  totalResults?: number;
  hasMore?: boolean;
  onToggle: () => void;
  onClose: () => void;
  onQueryChange: (value: string) => void;
  onLoadMore?: () => void;
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
    <div className="bg-[color:var(--topbar-bg)] backdrop-blur-lg border-b border-[color:var(--topbar-border)] py-3.5 px-6 flex items-center justify-between sticky top-0 z-40 shadow-[var(--topbar-shadow)]">
      <h1 className="text-lg font-[800] text-text-primary">{title}</h1>

      <div className="flex items-center gap-3">
        <div style={{ direction: 'ltr' }}>
          <AppSwitcher />
        </div>

        <ThemeToggle />

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
              className="py-2 px-4 rounded-xl border border-border bg-[color:var(--surface-elevated)] text-text-primary text-sm font-bold transition-all duration-200 hover:bg-[color:var(--button-soft-hover)] cursor-pointer flex items-center gap-1.5"
            >
              🔍 بحث
            </button>

            <ReportSearchDropdown
              isOpen={search.isOpen}
              query={search.query}
              results={search.results}
              totalResults={search.totalResults}
              hasMore={search.hasMore}
              onQueryChange={search.onQueryChange}
              onLoadMore={search.onLoadMore}
              onSelect={search.onSelect}
              onClose={search.onClose}
            />
          </div>
        )}

        <button
          onClick={onGoHome}
          className="py-2 px-5 rounded-xl border border-border bg-[color:var(--surface-muted)] text-text-primary text-sm font-bold transition-all duration-200 hover:bg-[color:var(--button-soft-hover)] cursor-pointer"
        >
          🏠 الرئيسية
        </button>

        <button
          onClick={() => onStepChange(currentStep - 1)}
          disabled={currentStep === 0}
          className="py-2 px-5 rounded-xl border border-border bg-[color:var(--surface-elevated)] text-text-primary text-sm font-bold transition-all duration-200 hover:bg-[color:var(--button-soft-hover)] hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
