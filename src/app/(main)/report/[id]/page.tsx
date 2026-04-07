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
import AssetProtectionForm from '@/components/forms/AssetProtectionForm';
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
  AssetProtectionForm,    // 3: حماية الأصول الحيوية
  SPSDomainsForm,         // 4: مؤشرات وضع الأمان
  KPIForm,                // 5: المؤشرات والمعايير
  EfficiencyForm,         // 6: مؤشرات الكفاءة التشغيلية
  SLAForm,                // 7: مقاييس الاستجابة
  RecommendationsForm,    // 8: التوصيات والإجراءات
  MaturityForm,           // 9: مستوى النضج الأمني
];

const MAX_STEP = FORM_SECTIONS.length - 1;
const SEARCH_PAGE_SIZE = 40;
const SEARCH_DEBOUNCE_MS = 220;

function clampStep(step: number): number {
  return Math.max(0, Math.min(MAX_STEP, step));
}

function parseStepParam(value: string | null): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  return clampStep(parsed);
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
    setSearchLimit(SEARCH_PAGE_SIZE);
  }, [searchQuery]);

  const searchPage = useMemo(
    () => searchReportIndex(searchIndex, debouncedSearchQuery, { limit: searchLimit }),
    [searchIndex, debouncedSearchQuery, searchLimit],
  );
  const searchResults = searchPage.results;

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
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, setReport, router]);

  // Auto-save
  const doSave = useCallback(async () => {
    const store = useReportStore.getState();
    const currentReport = store.report;
    if (!currentReport || !store.isDirty) return;

    setSaving(true);
    try {
      await updateReport(currentReport.id, currentReport);
      setLastSaved(new Date());
      setDirty(false);
    } catch (e) {
      console.error('Auto-save failed:', e);
    } finally {
      setSaving(false);
    }
  }, [setSaving, setLastSaved, setDirty]);

  const saveThenNavigate = useCallback(
    async (path: string) => {
      await doSave();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-[#eef1f8] flex" dir="rtl">
      <Sidebar currentStep={currentStep} onStepChange={navigateToStep} />
      <div className="flex-1 mr-[280px] flex flex-col min-h-screen">
        <TopBar
          currentStep={currentStep}
          onStepChange={navigateToStep}
          onPreview={() => {
            void saveThenNavigate(`/report/${id}/preview`);
          }}
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
            onToggle: () => setSearchOpen((prev) => !prev),
            onClose: () => setSearchOpen(false),
            onQueryChange: setSearchQuery,
            onLoadMore: () => setSearchLimit((prev) => prev + SEARCH_PAGE_SIZE),
            onSelect: handleSelectSearchResult,
          }}
        />
        <div className="flex-1 overflow-y-auto p-6 pb-10">
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
