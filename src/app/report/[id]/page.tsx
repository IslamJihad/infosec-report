'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReportStore } from '@/store/reportStore';
import { fetchReport, updateReport } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import GeneralInfoForm from '@/components/forms/GeneralInfoForm';
import ExecutiveSummaryForm from '@/components/forms/ExecutiveSummaryForm';
import KPIForm from '@/components/forms/KPIForm';
import SLAForm from '@/components/forms/SLAForm';
import RisksForm from '@/components/forms/RisksForm';
import MaturityForm from '@/components/forms/MaturityForm';
import RecommendationsForm from '@/components/forms/RecommendationsForm';
import AIReviewModal from '@/components/ai/AIReviewModal';

const FORM_SECTIONS = [
  GeneralInfoForm,
  ExecutiveSummaryForm,
  KPIForm,
  SLAForm,
  RisksForm,
  MaturityForm,
  RecommendationsForm,
];

export default function ReportEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { report, setReport, currentStep, isDirty, setSaving, setLastSaved, setDirty } = useReportStore();

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

  useEffect(() => {
    if (!isDirty) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(doSave, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [isDirty, report, doSave]);

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
      <Sidebar />
      <div className="flex-1 mr-[280px] flex flex-col min-h-screen">
        <TopBar
          onPreview={() => {
            doSave();
            router.push(`/report/${id}/preview`);
          }}
          onAIReview={() => setShowAI(true)}
        />
        <div className="flex-1 overflow-y-auto p-6 pb-10">
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
