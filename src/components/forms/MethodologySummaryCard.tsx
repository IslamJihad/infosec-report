'use client';

import { useEffect, useState } from 'react';
import type { ReportData } from '@/types/report';
import { calculateGlobalSecurityScore } from '@/lib/scoring';
import { DEFAULT_SPS_DOMAINS } from '@/lib/constants';

interface Props {
  report: ReportData;
}

const TONE_CLASSES = [
  'border-blue-200 bg-blue-50 text-blue-900',
  'border-violet-200 bg-violet-50 text-violet-900',
  'border-teal-200 bg-teal-50 text-teal-900',
  'border-amber-200 bg-amber-50 text-amber-900',
  'border-red-200 bg-red-50 text-red-900',
  'border-green-200 bg-green-50 text-green-900',
];

export default function MethodologySummaryCard({ report }: Props) {
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const spsDomains = Array.isArray(report.spsDomains) && report.spsDomains.length > 0
    ? report.spsDomains
    : DEFAULT_SPS_DOMAINS;

  const scoreBreakdown = report.scoreBreakdown
    ?? calculateGlobalSecurityScore({ id: report.id, spsDomains }).scoreBreakdown;

  const { domainResults } = scoreBreakdown;

  useEffect(() => {
    if (!showModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (showSourcesModal) { setShowSourcesModal(false); return; }
      setShowModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showModal, showSourcesModal]);

  const details = (
    <>
      {/* Formula */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-xs text-text-muted leading-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 ltr text-left">
          SPS = clamp(round(Σ DomainScore × DomainWeight), 0, 100)&nbsp;&nbsp;|&nbsp;&nbsp;DomainScore = Σ(subMetric × weight) / Σ(weights)
        </div>
        <button
          type="button"
          onClick={() => setShowSourcesModal(true)}
          className="text-xs font-bold bg-white border border-border rounded-lg px-3 py-1.5 text-navy-800 hover:bg-navy-50 transition-colors whitespace-nowrap"
        >
          عرض المراجع والمنهجية
        </button>
      </div>

      {/* 6-Domain overview grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {domainResults.map((d, i) => (
          <div key={d.id} className={`rounded-xl border px-3 py-2.5 ${TONE_CLASSES[i % TONE_CLASSES.length]}`}>
            <div className="text-[11px] opacity-75">{d.nameAr} ({Math.round(d.domainWeight * 100)}%)</div>
            <div className="text-sm font-[900] mt-0.5">{d.domainScore}/100</div>
            <div className="text-[10px] opacity-60 mt-0.5">مساهمة: {d.domainContribution}</div>
            {d.usedNeutralDefault && (
              <div className="text-[10px] text-amber-600 mt-0.5">قيمة محايدة (50)</div>
            )}
          </div>
        ))}
      </div>

      {/* Per-domain sub-metric detail */}
      <div className="grid md:grid-cols-2 gap-3 mb-3">
        {domainResults.map((d, i) => {
          const domain = spsDomains.find((x) => x.id === d.id);
          const toneClass = TONE_CLASSES[i % TONE_CLASSES.length];
          return (
            <div key={d.id} className={`rounded-xl border px-4 py-3 text-xs leading-6 ${toneClass}`}>
              <div className="font-bold mb-1">{d.nameAr}</div>
              {domain?.subMetrics.map((sm) => (
                <div key={sm.id}>
                  {sm.nameAr}: <span className="font-semibold">{sm.value}</span> (و:{sm.weight})
                </div>
              ))}
              <div className="font-bold mt-1">
                درجة المجال = {d.domainScore}/100 | مساهمة = {d.domainContribution}
              </div>
            </div>
          );
        })}

        {/* Weighted contributions summary */}
        <div className="rounded-xl border border-navy-200 bg-navy-50 px-4 py-3 text-xs text-navy-900 leading-6">
          <div className="font-bold mb-1">المساهمات الموزونة</div>
          {domainResults.map((d) => (
            <div key={d.id}>
              {Math.round(d.domainWeight * 100)}% × {d.domainScore} ({d.nameAr}) = {d.domainContribution}
            </div>
          ))}
          <div className="mt-1 font-bold">
            المجموع = {scoreBreakdown.rawScore} → النتيجة النهائية = {scoreBreakdown.finalScore}/100
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-900 leading-7">
        <div>النتيجة قبل التقريب: <span className="font-bold">{scoreBreakdown.rawScore}</span></div>
        <div>النتيجة النهائية: <span className="font-[900] text-base">{scoreBreakdown.finalScore}/100</span></div>
        <div>النسخة المستخدمة: <span className="font-bold">{scoreBreakdown.formulaVersion}</span></div>
      </div>
    </>
  );

  return (
    <>
      <div className="bg-white rounded-2xl border border-border/60 mb-5 overflow-hidden shadow-md" dir="rtl">
        <div className="bg-gradient-to-l from-navy-50 to-white py-4 px-5 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-navy-800 to-navy-900 text-white w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 shadow-sm">
              🧪
            </div>
            <div>
              <h3 className="text-base font-[800] text-navy-950">القيم المستخدمة في حساب درجة SPS</h3>
              <p className="text-xs text-text-muted mt-0.5">مخفية افتراضيا لتقليل المساحة. يمكن فتحها كنافذة عند الحاجة.</p>
            </div>
          </div>
          <div className="text-xs font-bold text-navy-900 bg-navy-50 border border-navy-100 rounded-lg px-2.5 py-1.5">
            الدرجة الحالية: {scoreBreakdown.finalScore}/100
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
            {domainResults.map((d, i) => (
              <div key={d.id} className={`rounded-xl border px-2 py-2 ${TONE_CLASSES[i % TONE_CLASSES.length]}`}>
                <div className="text-[10px] opacity-70 truncate">{d.nameAr}</div>
                <div className="text-sm font-[900] mt-0.5">{d.domainScore}</div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => { setShowModal(true); setShowSourcesModal(false); }}
            className="text-xs font-bold bg-navy-900 border border-navy-900 rounded-lg px-3 py-1.5 text-white hover:bg-navy-800 transition-colors"
          >
            فتح كنافذة مستقلة
          </button>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-[1px] p-4 flex items-center justify-center"
          onClick={() => { setShowModal(false); setShowSourcesModal(false); }}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-border shadow-2xl"
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-[900] text-navy-950">تفاصيل حساب درجة وضع الأمان (SPS v1)</h3>
                <p className="text-xs text-text-muted mt-0.5">يمكن اغلاق النافذة في اي وقت بدون التأثير على البيانات.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowModal(false); setShowSourcesModal(false); }}
                className="w-9 h-9 rounded-xl border border-border text-text-muted hover:bg-red-50 hover:text-danger-500 transition-colors"
                aria-label="اغلاق"
              >
                ×
              </button>
            </div>
            <div className="p-5">{details}</div>

            {showSourcesModal && (
              <div
                className="absolute inset-0 z-[120] bg-black/40 p-4 flex items-center justify-center"
                onClick={() => setShowSourcesModal(false)}
              >
                <div
                  className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white border border-border shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center justify-between">
                    <div className="font-bold text-text-secondary">المرجع العلمي والمنهجي — SPS v1</div>
                    <button
                      type="button"
                      onClick={() => setShowSourcesModal(false)}
                      className="w-8 h-8 rounded-lg border border-border text-text-muted hover:bg-red-50 hover:text-danger-500 transition-colors"
                      aria-label="اغلاق"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-4 text-xs text-text-muted leading-6">
                    <div>معادلة SPS v1 مبنية على نموذج متوسط مرجح ثنائي المستوى: درجة مجال ← مساهمة مجال ← درجة إجمالية.</div>
                    <ul className="list-disc pr-5 mt-2 space-y-1">
                      <li>
                        NIST CSF 2.0:{' '}
                        <a className="text-blue-700 hover:underline" href="https://doi.org/10.6028/NIST.CSWP.29" target="_blank" rel="noreferrer">
                          doi.org/10.6028/NIST.CSWP.29
                        </a>
                      </li>
                      <li>
                        ISO/IEC 27001:2022:{' '}
                        <a className="text-blue-700 hover:underline" href="https://www.iso.org/standard/27001" target="_blank" rel="noreferrer">
                          iso.org/standard/27001
                        </a>
                      </li>
                      <li>
                        NIST SP 800-30 Rev.1:{' '}
                        <a className="text-blue-700 hover:underline" href="https://doi.org/10.6028/NIST.SP.800-30r1" target="_blank" rel="noreferrer">
                          doi.org/10.6028/NIST.SP.800-30r1
                        </a>
                      </li>
                    </ul>
                    <div className="mt-3 font-semibold text-navy-800">مقياس التصنيف:</div>
                    <ul className="list-disc pr-5 mt-1 space-y-0.5">
                      <li>90–100: ممتاز</li>
                      <li>80–89: قوي</li>
                      <li>70–79: متوسط</li>
                      <li>60–69: دون المتوسط</li>
                      <li>0–59: حرج</li>
                    </ul>
                    <div className="mt-2 text-amber-700">
                      ملاحظة: الأوزان قابلة للمراجعة الدورية وليست قيمة إلزامية من معيار واحد.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

