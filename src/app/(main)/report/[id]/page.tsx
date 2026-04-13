'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useReportStore } from '@/store/reportStore';
import { fetchReport, updateReport } from '@/lib/api';
import { buildReportSearchIndex, searchReportIndex, type ReportSearchResult } from '@/lib/search/reportSearch';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import GeneralInfoForm from '@/components/forms/GeneralInfoForm';
import ExecutiveSummaryForm from '@/components/forms/ExecutiveSummaryForm';
import RisksForm from '@/components/forms/RisksForm';
import SPSDomainsForm from '@/components/forms/SPSDomainsForm';
import KPIForm from '@/components/forms/KPIForm';
import EfficiencyForm from '@/components/forms/EfficiencyForm';
import SLAForm from '@/components/forms/SLAForm';
import RecommendationsForm from '@/components/forms/RecommendationsForm';
import MaturityForm from '@/components/forms/MaturityForm';
import MethodologySummaryCard from '@/components/forms/MethodologySummaryCard';
import AIReviewModal from '@/components/ai/AIReviewModal';

const FORM_SECTIONS = [
  GeneralInfoForm,        // 0: معلومات التقرير
  ExecutiveSummaryForm,   // 1: الملخص التنفيذي
  RisksForm,              // 2: المخاطر الرئيسية
  SPSDomainsForm,         // 3: مؤشرات وضع الأمان
  KPIForm,                // 4: المؤشرات والمعايير
  EfficiencyForm,         // 5: مؤشرات الكفاءة التشغيلية
  SLAForm,                // 6: مقاييس الاستجابة
  RecommendationsForm,    // 7: التوصيات والإجراءات
  MaturityForm,           // 8: مستوى النضج الأمني
];

const MAX_STEP = FORM_SECTIONS.length - 1;
const SEARCH_PAGE_SIZE = 40;
const SEARCH_DEBOUNCE_MS = 220;
const SEARCH_HINT_STORAGE_KEY = 'report-editor-search-hint-dismissed-v1';

function clampStep(step: number): number {
  return Math.max(0, Math.min(MAX_STEP, step));
}

function parseStepParam(value: string | null): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  return clampStep(parsed);
}

const CORE_REQUIRED_FIELDS = [
  { key: 'orgName', label: 'اسم المنظمة' },
  { key: 'recipientName', label: 'المستلم' },
  { key: 'subject', label: 'الموضوع' },
  { key: 'period', label: 'الفترة الزمنية' },
  { key: 'issueDate', label: 'تاريخ الإصدار' },
  { key: 'author', label: 'معد التقرير' },
] as const;

function getMissingCoreFieldLabels(report: {
  orgName: string;
  recipientName: string;
  subject: string;
  period: string;
  issueDate: string;
  author: string;
}): string[] {
  return CORE_REQUIRED_FIELDS
    .filter(({ key }) => !report[key].trim())
    .map(({ label }) => label);
}

export default function ReportEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchLimit, setSearchLimit] = useState(SEARCH_PAGE_SIZE);
  const [pendingTargetId, setPendingTargetId] = useState<string | null>(null);
  const [searchHintVisible, setSearchHintVisible] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewValidationError, setPreviewValidationError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { report, setReport, currentStep, setStep, isDirty, setSaving, setLastSaved, setDirty } = useReportStore();

  const searchIndex = useMemo(() => {
    if (!report) return [];
    return buildReportSearchIndex(report, 'editor');
  }, [report]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchQuery(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(SEARCH_HINT_STORAGE_KEY) === '1';
      setSearchHintVisible(!dismissed);
    } catch {
      setSearchHintVisible(true);
    }
  }, []);

  useEffect(() => {
    setSearchLimit(SEARCH_PAGE_SIZE);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/') return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isEditable = Boolean(
        target && (target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select'),
      );

      if (isEditable) return;

      event.preventDefault();
      setSearchHintVisible(false);
      setSearchOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const searchPage = useMemo(
    () => searchReportIndex(searchIndex, debouncedSearchQuery, { limit: searchLimit }),
    [searchIndex, debouncedSearchQuery, searchLimit],
  );
  const searchResults = searchPage.results;

  const dismissSearchHint = useCallback((persist = false) => {
    setSearchHintVisible(false);

    if (!persist) return;

    try {
      window.localStorage.setItem(SEARCH_HINT_STORAGE_KEY, '1');
    } catch {
      // Ignore storage failures; this hint is optional.
    }
  }, []);

  const syncStepToUrl = useCallback(
    (step: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('step', String(step));

      router.replace(`/report/${id}?${params.toString()}`, { scroll: false });
    },
    [id, router, searchParams],
  );

  const navigateToStep = useCallback(
    (step: number) => {
      const normalizedStep = clampStep(step);
      if (normalizedStep !== currentStep) {
        setStep(normalizedStep);
      }

      if (parseStepParam(searchParams.get('step')) !== normalizedStep) {
        syncStepToUrl(normalizedStep);
      }
    },
    [currentStep, searchParams, setStep, syncStepToUrl],
  );

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

  const handleSelectSearchResult = useCallback(
    (result: ReportSearchResult) => {
      setSearchOpen(false);

      if (currentStep !== result.sectionStep) {
        navigateToStep(result.sectionStep);
      }

      setPendingTargetId(result.targetId);
    },
    [currentStep, navigateToStep],
  );

  useEffect(() => {
    const urlStep = parseStepParam(searchParams.get('step'));

    if (urlStep === null) {
      if (currentStep !== 0) {
        setStep(0);
      }
      return;
    }

    if (urlStep !== currentStep) {
      setStep(urlStep);
    }
  }, [currentStep, searchParams, setStep]);

  // Load report
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchReport(id);
        setReport(data);
        setSaveError(null);
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, setReport, router]);

  // Auto-save
  const doSave = useCallback(async (): Promise<boolean> => {
    const store = useReportStore.getState();
    const currentReport = store.report;
    if (!currentReport || !store.isDirty) return true;

    setSaving(true);
    try {
      await updateReport(currentReport.id, currentReport);
      setLastSaved(new Date());
      setDirty(false);
      setSaveError(null);
      return true;
    } catch (e) {
      console.error('Auto-save failed:', e);
      setSaveError('تعذر حفظ التعديلات تلقائياً. يرجى إعادة المحاولة قبل مغادرة الصفحة.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [setSaving, setLastSaved, setDirty]);

  const saveThenNavigate = useCallback(
    async (path: string) => {
      const saveSucceeded = await doSave();
      if (!saveSucceeded) return;
      router.push(path);
    },
    [doSave, router],
  );

  useEffect(() => {
    if (!isDirty) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(doSave, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [isDirty, report, doSave]);

  useEffect(() => {
    if (!pendingTargetId) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;

      if (highlightTarget(pendingTargetId) || attempts > 16) {
        window.clearInterval(timer);
        setPendingTargetId(null);
      }
    }, 90);

    return () => window.clearInterval(timer);
  }, [pendingTargetId, currentStep, highlightTarget]);

  const handlePreview = useCallback(() => {
    if (!report) return;

    const missing = getMissingCoreFieldLabels(report);
    if (missing.length > 0) {
      setPreviewValidationError(`لا يمكن إنشاء المعاينة قبل إكمال: ${missing.join('، ')}`);
      return;
    }

    setPreviewValidationError(null);
    void saveThenNavigate(`/report/${id}/preview`);
  }, [id, report, saveThenNavigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="text-4xl animate-spin inline-block mb-3">⚙️</div>
          <p className="text-text-muted text-sm">جاري تحميل التقرير...</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const CurrentForm = FORM_SECTIONS[currentStep];
  const missingCoreFields = getMissingCoreFieldLabels(report);
  const activePreviewValidationError = missingCoreFields.length > 0 ? previewValidationError : null;

  return (
    <div className="min-h-screen [background:var(--page-main-bg)] flex" dir="rtl">
      <Sidebar currentStep={currentStep} onStepChange={navigateToStep} />
      <div className="flex-1 mr-[280px] flex flex-col min-h-screen">
        <TopBar
          currentStep={currentStep}
          onStepChange={navigateToStep}
          onPreview={handlePreview}
          onAIReview={() => setShowAI(true)}
          onGoHome={() => {
            void saveThenNavigate('/');
          }}
          search={{
            isOpen: searchOpen,
            query: searchQuery,
            results: searchResults,
            totalResults: searchPage.total,
            hasMore: searchPage.hasMore,
            onToggle: () => {
              dismissSearchHint(true);
              setSearchOpen((prev) => !prev);
            },
            onClose: () => setSearchOpen(false),
            onQueryChange: setSearchQuery,
            onLoadMore: () => setSearchLimit((prev) => prev + SEARCH_PAGE_SIZE),
            onSelect: handleSelectSearchResult,
          }}
        />
        <div className="flex-1 overflow-y-auto p-6 pb-10">
          {searchHintVisible && !searchOpen && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <span>💡 يمكنك البحث داخل التقرير بسرعة عبر زر البحث أو بالضغط على /</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    dismissSearchHint(true);
                    setSearchOpen(true);
                  }}
                  className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-bold text-blue-900 transition-colors hover:bg-blue-100"
                >
                  فتح البحث
                </button>
                <button
                  onClick={() => dismissSearchHint(true)}
                  className="rounded-lg border border-blue-200 bg-transparent px-3 py-1.5 text-xs font-bold text-blue-900 transition-colors hover:bg-blue-100"
                >
                  إخفاء
                </button>
              </div>
            </div>
          )}

          {saveError && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger-700">
              <span>⚠️ {saveError}</span>
              <button
                onClick={() => {
                  void doSave();
                }}
                className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-danger-700 transition-colors hover:bg-red-100"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {activePreviewValidationError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger-700" role="alert">
              ⚠️ {activePreviewValidationError}
            </div>
          )}

          {missingCoreFields.length > 0 && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              ⚠️ الحقول الأساسية الناقصة: {missingCoreFields.join('، ')}
            </div>
          )}

          <MethodologySummaryCard report={report} />
          <CurrentForm />
        </div>
      </div>

      <AIReviewModal
        report={report}
        isOpen={showAI}
        onClose={() => setShowAI(false)}
      />
    </div>
  );
}
