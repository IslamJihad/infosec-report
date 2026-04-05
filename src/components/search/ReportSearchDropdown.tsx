'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { ReportSearchResult } from '@/lib/search/reportSearch';

interface ReportSearchDropdownProps {
  isOpen: boolean;
  query: string;
  results: ReportSearchResult[];
  onQueryChange: (value: string) => void;
  onSelect: (result: ReportSearchResult) => void;
  onClose: () => void;
  placeholder?: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderHighlighted(text: string, query: string) {
  const safeQuery = query.trim();
  if (!safeQuery) return text;

  const regex = new RegExp(`(${escapeRegExp(safeQuery)})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === safeQuery.toLowerCase()) {
      return (
        <mark key={`${part}-${index}`} className="bg-amber-100 text-amber-800 rounded px-0.5">
          {part}
        </mark>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export default function ReportSearchDropdown({
  isOpen,
  query,
  results,
  onQueryChange,
  onSelect,
  onClose,
  placeholder = 'ابحث عن أي قيمة داخل التقرير...',
}: ReportSearchDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const grouped = useMemo(() => {
    const groups = new Map<string, ReportSearchResult[]>();

    for (const result of results) {
      if (!groups.has(result.sectionLabel)) groups.set(result.sectionLabel, []);
      groups.get(result.sectionLabel)?.push(result);
    }

    return Array.from(groups.entries());
  }, [results]);

  const flatResults = useMemo(() => grouped.flatMap(([, sectionResults]) => sectionResults), [grouped]);

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    flatResults.forEach((result, index) => {
      map.set(result.id, index);
    });
    return map;
  }, [flatResults]);

  useEffect(() => {
    if (!isOpen) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        onClose();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown);
    window.setTimeout(() => inputRef.current?.focus(), 10);

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showTypingHint = query.trim().length < 2;

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (flatResults.length === 0) return;
      setActiveIndex((current) => Math.min(flatResults.length - 1, current + 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (flatResults.length === 0) return;
      setActiveIndex((current) => Math.max(0, current - 1));
      return;
    }

    if (event.key === 'Enter') {
      if (flatResults.length === 0) return;
      event.preventDefault();
      const selected = flatResults[activeIndex];
      if (selected) onSelect(selected);
    }
  };

  return (
    <div
      ref={rootRef}
      className="absolute top-[calc(100%+10px)] right-0 z-[120] w-[460px] max-w-[90vw] bg-white border border-border rounded-2xl shadow-[0_20px_45px_rgba(12,24,48,0.22)] overflow-hidden"
      dir="rtl"
    >
      <div className="p-3 border-b border-border bg-navy-50/50">
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setActiveIndex(0);
            onQueryChange(event.target.value);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          className="w-full border-[1.5px] border-border rounded-xl py-2.5 px-3.5 text-sm text-text-primary outline-none transition-all duration-200 focus:border-navy-700 focus:shadow-[0_0_0_3px_rgba(26,58,124,0.1)] bg-white"
        />
        <div className="text-[11px] text-text-hint mt-2">
          {showTypingHint
            ? 'اكتب حرفين على الأقل لبدء البحث الذكي.'
            : results.length > 0
              ? `${results.length} نتيجة مطابقة · ${Math.min(activeIndex + 1, results.length)} من ${results.length}`
              : 'لا توجد نتائج مطابقة.'}
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto p-2 bg-white">
        {!showTypingHint && results.length === 0 && (
          <div className="py-8 text-center text-sm text-text-muted">
            لا توجد نتائج مطابقة. جرّب كلمة أقرب.
          </div>
        )}

        {!showTypingHint && grouped.map(([section, sectionResults]) => (
          <div key={section} className="mb-2.5 last:mb-0">
            <div className="px-2 py-1.5 text-[11px] font-bold text-navy-800 bg-navy-50 rounded-lg mb-1.5">
              {section}
            </div>
            <div className="space-y-1">
              {sectionResults.map((result) => {
                const resultIndex = indexById.get(result.id) ?? -1;
                const isActive = resultIndex === activeIndex;

                return (
                <button
                  type="button"
                  key={result.id}
                  onClick={() => onSelect(result)}
                  onMouseEnter={() => {
                    if (resultIndex >= 0) setActiveIndex(resultIndex);
                  }}
                  className={`w-full text-right p-2.5 rounded-xl border transition-all duration-150 ${isActive ? 'border-navy-300 bg-navy-50/70' : 'border-transparent hover:border-navy-200 hover:bg-navy-50/60'}`}
                >
                  <div className="text-sm font-bold text-navy-950">{renderHighlighted(result.title, query)}</div>
                  <div className="text-xs text-text-muted mt-0.5 leading-5 line-clamp-2">
                    {renderHighlighted(result.snippet, query)}
                  </div>
                </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
