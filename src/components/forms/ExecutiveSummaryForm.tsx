'use client';

import { useState } from 'react';
import { useReportStore } from '@/store/reportStore';
import { SECURITY_LEVELS, TRENDS, getScoreColorClass, DEFAULT_SPS_DOMAINS } from '@/lib/constants';
import { calculateGlobalSecurityScore } from '@/lib/scoring';
import { FormCard, FormField } from './GeneralInfoForm';

export default function ExecutiveSummaryForm() {
  const { report, updateField, addDecision, updateDecision, removeDecision } = useReportStore();
  const [showScoreHelp, setShowScoreHelp] = useState(false);
  if (!report) return null;

  const scoreColor = getScoreColorClass(report.securityScore);
  const hasPercentile = typeof report.scorePercentile === 'number';
  const spsDomains = Array.isArray(report.spsDomains) && report.spsDomains.length > 0
    ? report.spsDomains : DEFAULT_SPS_DOMAINS;
  const scoreBreakdown = report.scoreBreakdown ?? calculateGlobalSecurityScore({ id: report.id, spsDomains }).scoreBreakdown;
  const { domainResults } = scoreBreakdown;

  return (
    <div id="search-editor-section-executive" className="animate-fadeIn">
      <FormCard icon="📋" title="الملخص التنفيذي">
        <div className="mb-4">
          <label className="text-sm font-bold text-text-secondary block mb-2">نص الملخص</label>
          <textarea
            value={report.summary}
            onChange={(e) => updateField('summary', e.target.value)}
            rows={5}
            className="w-full border-[1.5px] border-border rounded-xl py-3 px-4 text-sm text-text-primary outline-none transition-all duration-200 focus:border-navy-700 focus:shadow-[0_0_0_3px_rgba(26,58,124,0.1)] resize-y min-h-[100px] hover:border-navy-200"
            placeholder="أدخل ملخصاً تنفيذياً شاملاً عن الوضع الأمني..."
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-secondary">المستوى العام</label>
            <select
              value={report.securityLevel}
              onChange={(e) => updateField('securityLevel', e.target.value)}
              className="border-[1.5px] border-border rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-navy-700 focus:shadow-[0_0_0_3px_rgba(26,58,124,0.1)] bg-white hover:border-navy-200 transition-all duration-200"
            >
              {SECURITY_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-secondary">الدرجة العالمية (تلقائية)</label>
            <div className="rounded-xl border border-border bg-surface px-3.5 py-3 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-base font-[900] px-3 py-1 rounded-lg ${scoreColor.bg} ${scoreColor.text}`}>
                  {report.securityScore}/100
                </span>
                {hasPercentile && (
                  <span className="text-xs font-bold text-navy-800 bg-navy-50 border border-navy-100 rounded-lg px-2 py-1">
                    اعلى من {report.scorePercentile}% من التقارير
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowScoreHelp(true)}
                className="mb-2 text-xs font-bold bg-white border border-border rounded-lg px-2.5 py-1.5 text-navy-800 hover:bg-navy-50 transition-colors"
              >
                شرح مبسط: كيف انحسبت الدرجة؟
              </button>
              <p className="text-[11px] leading-5 text-text-muted ltr text-left">
                SPS = clamp(round(Σ DomainScore × DomainWeight), 0, 100)
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-secondary">الاتجاه</label>
            <select
              value={report.trend}
              onChange={(e) => updateField('trend', e.target.value)}
              className="border-[1.5px] border-border rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-navy-700 focus:shadow-[0_0_0_3px_rgba(26,58,124,0.1)] bg-white hover:border-navy-200 transition-all duration-200"
            >
              {TRENDS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </FormCard>

      {showScoreHelp && (
        <div className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-border shadow-2xl" dir="rtl">
            <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-[900] text-navy-950">شرح بسيط جدا لدرجة وضع الأمان (SPS v1)</h3>
                <p className="text-xs text-text-muted mt-1">هنا نشرح كل رقم بطريقة مباشرة وواضحة.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowScoreHelp(false)}
                className="w-9 h-9 rounded-xl border border-border text-text-muted hover:bg-red-50 hover:text-danger-500 transition-colors"
                aria-label="اغلاق"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm text-text-primary leading-7">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="font-bold text-navy-900">المعادلة النهائية (SPS v1)</div>
                <div className="text-xs text-text-muted mt-1 break-words ltr text-left">
                  SPS = clamp(round(Σ DomainScore × DomainWeight), 0, 100) | DomainScore = Σ(sm.value × sm.weight) / Σ(sm.weight)
                </div>
                <div className="mt-2 text-sm">
                  النتيجة الحالية: <span className="font-[900] text-navy-900">{scoreBreakdown.finalScore}/100</span>
                </div>
              </div>

              {/* Per-domain breakdown */}
              {domainResults.map((d, i) => {
                const domain = spsDomains.find((x) => x.id === d.id);
                const tones = [
                  'border-blue-200 bg-blue-50 text-blue-900',
                  'border-violet-200 bg-violet-50 text-violet-900',
                  'border-teal-200 bg-teal-50 text-teal-900',
                  'border-amber-200 bg-amber-50 text-amber-900',
                  'border-red-200 bg-red-50 text-red-900',
                  'border-green-200 bg-green-50 text-green-900',
                ];
                return (
                  <div key={d.id} className={`rounded-xl border p-4 ${tones[i % tones.length]}`}>
                    <div className="font-bold mb-1">
                      {i + 1}) {d.nameAr} — وزن {Math.round(d.domainWeight * 100)}%
                    </div>
                    {domain?.subMetrics.map((sm) => (
                      <div key={sm.id} className="text-xs">
                        {sm.nameAr}: <span className="font-semibold">{sm.value}</span> (و:{sm.weight})
                      </div>
                    ))}
                    {d.usedNeutralDefault && (
                      <div className="text-xs text-amber-700 mt-1">قيمة محايدة — لا توجد مقاييس مدخلة (50)</div>
                    )}
                    <div className="mt-1 text-xs">
                      درجة المجال = <span className="font-bold">{d.domainScore}/100</span>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      المساهمة: {Math.round(d.domainWeight * 100)}% × {d.domainScore} = <span className="font-bold">{d.domainContribution}</span>
                    </div>
                  </div>
                );
              })}

              <div className="rounded-xl border border-navy-200 bg-navy-50 p-4">
                <div className="font-bold text-navy-900">التجميع النهائي</div>
                <div className="mt-2 text-xs space-y-0.5">
                  {domainResults.map((d) => (
                    <div key={d.id}>
                      {Math.round(d.domainWeight * 100)}% × {d.domainScore} ({d.nameAr}) = {d.domainContribution}
                    </div>
                  ))}
                  <div className="pt-1 font-bold">
                    المجموع = {scoreBreakdown.rawScore} → النتيجة النهائية = {scoreBreakdown.finalScore}/100
                  </div>
                </div>
                {hasPercentile && (
                  <div className="mt-2">المقارنة مع باقي التقارير: <span className="font-bold">أعلى من {report.scorePercentile}% من التقارير</span></div>
                )}
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="font-bold text-navy-900 mb-1">المرجعية العلمية والمنهجية</div>
                <div className="text-xs text-text-muted leading-6 mb-2">
                  نموذج SPS v1 مبني على متوسط مرجح ثنائي المستوى، مرجعيته NIST CSF 2.0 وISO/IEC 27001:2022 وNIST SP 800-30.
                </div>
                <ul className="list-disc pr-5 text-xs text-text-muted space-y-1">
                  <li>
                    NIST CSF 2.0:{' '}
                    <a className="text-blue-700 hover:underline" href="https://doi.org/10.6028/NIST.CSWP.29" target="_blank" rel="noreferrer">
                      doi.org/10.6028/NIST.CSWP.29
                    </a>
                  </li>
                  <li>
                    NIST SP 800-30 Rev.1:{' '}
                    <a className="text-blue-700 hover:underline" href="https://doi.org/10.6028/NIST.SP.800-30r1" target="_blank" rel="noreferrer">
                      doi.org/10.6028/NIST.SP.800-30r1
                    </a>
                  </li>
                  <li>
                    ISO/IEC 27001:2022:{' '}
                    <a className="text-blue-700 hover:underline" href="https://www.iso.org/standard/27001" target="_blank" rel="noreferrer">
                      iso.org/standard/27001
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <FormCard icon="⚠️" title="القرارات المطلوبة من الإدارة">
        <div className="bg-navy-100 border border-blue-200 rounded-xl py-3 px-4 text-sm text-navy-800 mb-4">
          💡 أدخل القرارات التي تحتاج موافقة أو توجيه من الإدارة العليا.
        </div>

        {report.decisions.map((dec, i) => (
          <div id={`search-editor-decision-${dec.id}`} key={dec.id} className="bg-surface border border-border/60 rounded-2xl p-5 mb-3 relative animate-fadeIn shadow-sm hover:shadow-md transition-all duration-200">
            <button
              onClick={() => removeDecision(i)}
              className="absolute top-3 left-3 bg-danger-100 text-danger-500 border border-red-200 rounded-xl w-7 h-7 cursor-pointer text-sm flex items-center justify-center hover:bg-red-200 transition-all duration-200"
            >
              ×
            </button>
            <div className="pr-0 pl-10">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <FormField label="عنوان القرار" value={dec.title} onChange={(v) => updateDecision(i, { title: v })} />
                <FormField label="الجهة المسؤولة" value={dec.department} onChange={(v) => updateDecision(i, { department: v })} />
              </div>
              <div className="mb-3">
                <label className="text-sm font-bold text-text-secondary block mb-2">التفاصيل</label>
                <textarea
                  value={dec.description}
                  onChange={(e) => updateDecision(i, { description: e.target.value })}
                  rows={2}
                  className="w-full border-[1.5px] border-border rounded-xl py-3 px-4 text-sm outline-none focus:border-navy-700 focus:shadow-[0_0_0_3px_rgba(26,58,124,0.1)] resize-y min-h-[64px] hover:border-navy-200 transition-all duration-200"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="الميزانية (₪)" value={dec.budget} onChange={(v) => updateDecision(i, { budget: v })} />
                <FormField label="الإطار الزمني" value={dec.timeline} onChange={(v) => updateDecision(i, { timeline: v })} />
                <FormField label="المسؤول المباشر" value={dec.owner || ''} onChange={(v) => updateDecision(i, { owner: v })} />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addDecision}
          className="flex items-center gap-2 bg-navy-50 text-navy-800 border-2 border-dashed border-navy-200 rounded-2xl py-3 px-4 cursor-pointer text-sm font-bold w-full justify-center transition-all duration-200 hover:bg-navy-100 hover:border-navy-600 hover:shadow-sm"
        >
          + إضافة قرار
        </button>
      </FormCard>
    </div>
  );
}
