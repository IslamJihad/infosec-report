'use client';

import { useEffect, useState } from 'react';
import type { ReportData } from '@/types/report';
import { calculateGlobalSecurityScore } from '@/lib/scoring';

interface Props {
  report: ReportData;
}

const BAND_LABELS: Record<string, string> = {
  critical: 'حرج',
  high: 'عالي',
  medium: 'متوسط',
  low: 'منخفض',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'مفتوح',
  inprogress: 'قيد المعالجة',
  closed: 'مغلق',
};

export default function MethodologySummaryCard({ report }: Props) {
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const scoreBreakdown = report.scoreBreakdown ?? calculateGlobalSecurityScore(report).scoreBreakdown;
  const { complianceDetails, maturityDetails, assetProtectionDetails, riskPostureDetails, operationalDetails, weightedContributions, componentScores } = scoreBreakdown;

  useEffect(() => {
    if (!showModal) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (showSourcesModal) {
        setShowSourcesModal(false);
        return;
      }

      setShowModal(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showModal, showSourcesModal]);

  const details = (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-xs text-text-muted leading-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          المعادلة: SPI = clamp(round(0.25×Compliance + 0.20×Maturity + 0.15×AssetProtection + 0.25×RiskPosture + 0.15×Operational), 0, 100)
        </div>
        <button
          type="button"
          onClick={() => setShowSourcesModal(true)}
          className="text-xs font-bold bg-white border border-border rounded-lg px-3 py-1.5 text-navy-800 hover:bg-navy-50 transition-colors whitespace-nowrap"
        >
          عرض المراجع والمنهجية
        </button>
      </div>

      {/* 5-Component Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
        <ComponentMetric label="الامتثال" score={componentScores.compliance} weight="25%" weighted={weightedContributions.compliance} tone="blue" />
        <ComponentMetric label="النضج الأمني" score={componentScores.maturity} weight="20%" weighted={weightedContributions.maturity} tone="violet" />
        <ComponentMetric label="حماية الأصول" score={componentScores.assetProtection} weight="15%" weighted={weightedContributions.assetProtection} tone="cyan" />
        <ComponentMetric label="وضع المخاطر" score={componentScores.riskPosture} weight="25%" weighted={weightedContributions.riskPosture} tone="red" />
        <ComponentMetric label="الكفاءة التشغيلية" score={componentScores.operational} weight="15%" weighted={weightedContributions.operational} tone="green" />
      </div>

      {/* Detailed Breakdowns */}
      <div className="grid md:grid-cols-2 gap-3 mb-3">
        {/* Compliance */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900 leading-6">
          <div className="font-bold mb-1">تفصيل الامتثال (Compliance)</div>
          <div>القيمة المدخلة: {complianceDetails.inputValue}%</div>
          <div className="font-bold">النتيجة = {complianceDetails.score}/100</div>
        </div>

        {/* Maturity */}
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs text-violet-900 leading-6">
          <div className="font-bold mb-1">تفصيل النضج الأمني (Maturity)</div>
          <div>عدد المجالات: {maturityDetails.domainCount}</div>
          {maturityDetails.usedNeutralDefault && (
            <div className="text-amber-700">لا توجد مجالات مدخلة — تم استخدام القيمة المحايدة (50)</div>
          )}
          {!maturityDetails.usedNeutralDefault && (
            <div>الدرجات المطبّعة: [{maturityDetails.normalizedScores.join(', ')}]</div>
          )}
          <div className="font-bold">النتيجة = {maturityDetails.score}/100</div>
        </div>

        {/* Asset Protection */}
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-xs text-cyan-900 leading-6">
          <div className="font-bold mb-1">تفصيل حماية الأصول (Asset Protection)</div>
          <div>عدد الأصول: {assetProtectionDetails.assetCount}</div>
          {assetProtectionDetails.usedNeutralDefault && (
            <div className="text-amber-700">لا توجد أصول مدخلة — تم استخدام القيمة المحايدة (50)</div>
          )}
          {!assetProtectionDetails.usedNeutralDefault && (
            <div>مستويات الحماية: [{assetProtectionDetails.protectionLevels.join(', ')}]</div>
          )}
          <div className="font-bold">النتيجة = {assetProtectionDetails.score}/100</div>
        </div>

        {/* Risk Posture */}
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-900 leading-6">
          <div className="font-bold mb-1">تفصيل وضع المخاطر (Risk Posture)</div>
          <div>إجمالي المخاطر: {riskPostureDetails.totalRisks} (مفتوحة: {riskPostureDetails.openRisks} | قيد المعالجة: {riskPostureDetails.inProgressRisks} | مغلقة: {riskPostureDetails.closedRisks})</div>
          <div>إجمالي الخصم: {riskPostureDetails.totalDeduction}</div>
          <div className="font-bold">النتيجة = max(0, 100 - {riskPostureDetails.totalDeduction}) = {riskPostureDetails.score}/100</div>
        </div>

        {/* Operational */}
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-900 leading-6">
          <div className="font-bold mb-1">تفصيل الكفاءة التشغيلية (Operational)</div>
          <div>تحقيق مؤشرات الأداء: {operationalDetails.kpiAchievement}%{operationalDetails.kpiUsedNeutralDefault ? ' (محايد — لا مؤشرات)' : ` (${operationalDetails.kpiCount} مؤشرات)`}</div>
          <div>امتثال SLA: {operationalDetails.slaCompliance}%{operationalDetails.slaUsedNeutralDefault ? ' (محايد — لا بيانات SLA)' : ` (MTTC: ${operationalDetails.slaMTTC} / هدف: ${operationalDetails.slaMTTCTarget})`}</div>
          <div className="font-bold">النتيجة = 0.70×{operationalDetails.kpiAchievement} + 0.30×{operationalDetails.slaCompliance} = {operationalDetails.score}/100</div>
        </div>

        {/* Weighted Contributions Summary */}
        <div className="rounded-xl border border-navy-200 bg-navy-50 px-4 py-3 text-xs text-navy-900 leading-6">
          <div className="font-bold mb-1">المساهمات الموزونة</div>
          <div>0.25 × {componentScores.compliance} (امتثال) = {weightedContributions.compliance}</div>
          <div>0.20 × {componentScores.maturity} (نضج) = {weightedContributions.maturity}</div>
          <div>0.15 × {componentScores.assetProtection} (أصول) = {weightedContributions.assetProtection}</div>
          <div>0.25 × {componentScores.riskPosture} (مخاطر) = {weightedContributions.riskPosture}</div>
          <div>0.15 × {componentScores.operational} (تشغيل) = {weightedContributions.operational}</div>
          <div className="mt-1 font-bold">المجموع = {scoreBreakdown.rawScore} → النتيجة النهائية = {scoreBreakdown.finalScore}/100</div>
        </div>
      </div>

      {/* Per-Risk Deduction Table */}
      {riskPostureDetails.perRiskDeductions.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-3 text-xs text-red-900 mb-3">
          <div className="font-bold mb-2">تفصيل خصم المخاطر (لكل خطر)</div>
          <div className="space-y-1">
            {riskPostureDetails.perRiskDeductions.map((r) => (
              <div key={r.index} className="rounded-lg border border-red-200 bg-white px-3 py-2">
                <div>
                  خطر #{r.index + 1}: الاحتمالية {r.probability} × الأثر {r.impact} = {r.riskScore} → <span className="font-bold">{BAND_LABELS[r.band] ?? r.band}</span>
                </div>
                <div>
                  الحالة: {STATUS_LABELS[r.status] ?? r.status} | الخصم: <span className="font-bold">{r.deduction === 0 ? '0 (مغلق)' : `-${r.deduction}`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-KPI Normalization */}
      {operationalDetails.normalizedKpis.length > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50/50 px-4 py-3 text-xs text-green-900 mb-3">
          <div className="font-bold mb-2">تفصيل تطبيع مؤشرات الكفاءة (لكل مؤشر)</div>
          <div className="space-y-1">
            {operationalDetails.normalizedKpis.map((kpi, index) => (
              <div key={`${kpi.id || kpi.title}-${index}`} className="rounded-lg border border-green-200 bg-white px-3 py-2">
                <div className="font-bold text-green-950">{kpi.title}</div>
                <div>
                  الفعلي: {kpi.actual} | الهدف: {kpi.target} | الاتجاه: {kpi.lowerBetter ? 'الأقل أفضل' : 'الأعلى أفضل'}
                </div>
                <div className="font-bold">المطبّع = {kpi.normalized}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <h3 className="text-base font-[800] text-navy-950">القيم المستخدمة في حساب الدرجة</h3>
              <p className="text-xs text-text-muted mt-0.5">مخفية افتراضيا لتقليل المساحة. يمكن فتحها كنافذة عند الحاجة.</p>
            </div>
          </div>
          <div className="text-xs font-bold text-navy-900 bg-navy-50 border border-navy-100 rounded-lg px-2.5 py-1.5">
            الدرجة الحالية: {scoreBreakdown.finalScore}/100
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-3">
            <Metric label="الامتثال" value={`${componentScores.compliance}`} tone="blue" />
            <Metric label="النضج" value={`${componentScores.maturity}`} tone="violet" />
            <Metric label="الأصول" value={`${componentScores.assetProtection}`} tone="cyan" />
            <Metric label="المخاطر" value={`${componentScores.riskPosture}`} tone="red" />
            <Metric label="التشغيل" value={`${componentScores.operational}`} tone="green" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowModal(true);
                setShowSourcesModal(false);
              }}
              className="text-xs font-bold bg-navy-900 border border-navy-900 rounded-lg px-3 py-1.5 text-white hover:bg-navy-800 transition-colors"
            >
              فتح كنافذة مستقلة
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-[1px] p-4 flex items-center justify-center"
          onClick={() => {
            setShowModal(false);
            setShowSourcesModal(false);
          }}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-border shadow-2xl"
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-[900] text-navy-950">تفاصيل حساب الدرجة العالمية (SPI v2)</h3>
                <p className="text-xs text-text-muted mt-0.5">يمكن اغلاق النافذة في اي وقت بدون التأثير على البيانات.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setShowSourcesModal(false);
                }}
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
                    <div className="font-bold text-text-secondary">المرجع العلمي والمنهجي</div>
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
                    <div>هذه المعادلة مبنية على مبادئ قياس المخاطر والأمن من معايير معروفة، مع أوزان معايرة داخلية خاصة بالمؤسسة.</div>
                    <ul className="list-disc pr-5 mt-2 space-y-1">
                      <li>
                        NIST SP 800-30 Rev.1 (Risk Assessment):{' '}
                        <a className="text-blue-700 hover:underline" href="https://doi.org/10.6028/NIST.SP.800-30r1" target="_blank" rel="noreferrer">
                          doi.org/10.6028/NIST.SP.800-30r1
                        </a>
                      </li>
                      <li>
                        NIST CSF 2.0 (Enterprise Cyber Risk):{' '}
                        <a className="text-blue-700 hover:underline" href="https://doi.org/10.6028/NIST.CSWP.29" target="_blank" rel="noreferrer">
                          doi.org/10.6028/NIST.CSWP.29
                        </a>
                      </li>
                      <li>
                        FIRST CVSS v4.0 (Vulnerability Severity Standard):{' '}
                        <a className="text-blue-700 hover:underline" href="https://www.first.org/cvss/v4.0/specification-document" target="_blank" rel="noreferrer">
                          first.org/cvss/v4.0/specification-document
                        </a>
                      </li>
                      <li>
                        ISO/IEC 27001:2022 (Risk-aware ISMS):{' '}
                        <a className="text-blue-700 hover:underline" href="https://www.iso.org/standard/27001" target="_blank" rel="noreferrer">
                          iso.org/standard/27001
                        </a>
                      </li>
                    </ul>
                    <div className="mt-2 text-amber-700">
                      ملاحظة حوكمة: الأوزان الرقمية (25%/20%/15%/25%/15%) هي قرار معايرة داخلي قابل للمراجعة الدورية، وليست رقما إلزاميا منصوصا عليه حرفيا في معيار واحد.
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

function ComponentMetric({
  label,
  score,
  weight,
  weighted,
  tone,
}: {
  label: string;
  score: number;
  weight: string;
  weighted: number;
  tone: 'blue' | 'violet' | 'cyan' | 'red' | 'green';
}) {
  const classMap: Record<typeof tone, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    violet: 'border-violet-200 bg-violet-50 text-violet-900',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    green: 'border-green-200 bg-green-50 text-green-900',
  };

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${classMap[tone]}`}>
      <div className="text-[11px] opacity-75">{label} ({weight})</div>
      <div className="text-sm font-[900] mt-0.5">{score}/100</div>
      <div className="text-[10px] opacity-60 mt-0.5">مساهمة: {weighted}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'blue' | 'violet' | 'cyan' | 'red' | 'green';
}) {
  const classMap: Record<typeof tone, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    violet: 'border-violet-200 bg-violet-50 text-violet-900',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    green: 'border-green-200 bg-green-50 text-green-900',
  };

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${classMap[tone]}`}>
      <div className="text-[11px] opacity-75">{label}</div>
      <div className="text-sm font-[900] mt-0.5">{value}</div>
    </div>
  );
}
