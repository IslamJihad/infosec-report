'use client';

import { useReportStore } from '@/store/reportStore';
import { NAV_ITEMS } from '@/lib/constants';

interface TopBarProps {
  onPreview: () => void;
  onAIReview: () => void;
}

export default function TopBar({ onPreview, onAIReview }: TopBarProps) {
  const { currentStep, setStep, isSaving, lastSaved } = useReportStore();

  const title = NAV_ITEMS[currentStep]?.label || '';

  return (
    <div className="bg-white border-b border-border py-2.5 px-5 flex items-center justify-between sticky top-0 z-40 shadow-[0_1px_6px_rgba(0,0,0,0.07)]">
      <h1 className="text-sm font-[800] text-navy-950">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Save status */}
        <span className="text-[9px] text-text-muted ml-3">
          {isSaving ? (
            <span className="flex items-center gap-1">
              <span className="animate-spin text-xs">⏳</span> جاري الحفظ...
            </span>
          ) : lastSaved ? (
            <span className="text-success-700">✓ تم الحفظ</span>
          ) : null}
        </span>

        <button
          onClick={() => setStep(currentStep - 1)}
          disabled={currentStep === 0}
          className="py-1.5 px-4 rounded-[7px] border border-border bg-white text-navy-800 font-[Cairo] text-[11px] font-bold transition-colors hover:bg-navy-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          → السابق
        </button>

        <button
          onClick={() => setStep(currentStep + 1)}
          disabled={currentStep === 6}
          className="py-1.5 px-4 rounded-[7px] border-none bg-navy-800 text-white font-[Cairo] text-[11px] font-bold transition-colors hover:bg-navy-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          التالي ←
        </button>

        <button
          onClick={onAIReview}
          className="py-1.5 px-4 rounded-[7px] border-none bg-purple-900 text-white font-[Cairo] text-[11px] font-bold transition-colors hover:bg-purple-950 cursor-pointer flex items-center gap-1"
        >
          🤖 مراجعة AI
        </button>

        <button
          onClick={onPreview}
          className="py-1.5 px-4 rounded-[7px] border-none bg-success-700 text-white font-[Cairo] text-[11px] font-bold transition-colors hover:bg-green-900 cursor-pointer flex items-center gap-1"
        >
          🖨️ إنشاء التقرير
        </button>
      </div>
    </div>
  );
}
