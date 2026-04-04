'use client';

import { useEffect, useState } from 'react';
import type { ReportData } from '@/types/report';
import { calculateGlobalSecurityScore } from '@/lib/scoring';

interface Props {
  report: ReportData;
}

export default function MethodologySummaryCard({ report }: Props) {
  const [showSources, setShowSources] = useState(false);
  const [showInlineDetails, setShowInlineDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const scoreBreakdown = report.scoreBreakdown ?? calculateGlobalSecurityScore(report).scoreBreakdown;
  const governance = scoreBreakdown.governanceDetails;
  const risk = scoreBreakdown.riskPenaltyDetails;
  const efficiency = scoreBreakdown.efficiencyBonusDetails;
  const sla = scoreBreakdown.slaPenaltyDetails;

  useEffect(() => {
    if (!showModal) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModal(false);
        setShowSources(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showModal]);

  const details = (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-xs text-text-muted leading-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          المعادلة: Score = clamp(round((0.40×Compliance + 0.35×Maturity + 0.25×Assets) - RiskPenalty + EfficiencyBonus - SlaPenalty), 0, 100)
        </div>
        <button
          type="button"
          onClick={() => setShowSources((prev) => !prev)}
          className="text-xs font-bold bg-white border border-border rounded-lg px-3 py-1.5 text-navy-800 hover:bg-navy-50 transition-colors whitespace-nowrap"
        >
          {showSources ? 'اخفاء المراجع' : 'عرض المراجع والمنهجية'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <Metric label="امتثال ISO" value={`${scoreBreakdown.components.kpiCompliance}%`} tone="blue" />
        <Metric label="متوسط النضج" value={`${scoreBreakdown.components.avgMaturity}%`} tone="blue" />
        <Metric label="متوسط حماية الاصول" value={`${scoreBreakdown.components.avgAssetProtection}%`} tone="blue" />
        <Metric label="Governance Base" value={String(scoreBreakdown.governanceBase)} tone="blue" />

        <Metric label="مخاطر حرجة" value={String(scoreBreakdown.components.criticalRisks)} tone="red" />
        <Metric label="مخاطر مفتوحة" value={String(scoreBreakdown.components.openRisks)} tone="red" />
        <Metric label="مخاطر كلية" value={String(scoreBreakdown.components.totalRisks)} tone="red" />
        <Metric label="Risk Penalty" value={`-${scoreBreakdown.riskPenalty}`} tone="red" />

        <Metric label="متوسط الكفاءة" value={`${scoreBreakdown.components.avgEfficiencyAchievement}%`} tone="green" />
        <Metric label="Efficiency Bonus" value={`+${scoreBreakdown.efficiencyBonus}`} tone="green" />
        <Metric label="MTTC / Target" value={`${scoreBreakdown.components.slaMTTC} / ${scoreBreakdown.components.slaMTTCTarget}`} tone="amber" />
        <Metric label="SLA Penalty" value={`-${scoreBreakdown.slaPenalty}`} tone="amber" />
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-3">
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900 leading-6">
          <div className="font-bold mb-1">تفصيل Governance Base</div>
          <div>0.40×Compliance = {governance.complianceWeighted}</div>
          <div>0.35×AvgMaturity = {governance.maturityWeighted}</div>
          <div>0.25×AvgAssetProtection = {governance.assetProtectionWeighted}</div>
          <div className="mt-1 font-bold">Governance Base = {governance.beforeRounding}</div>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-900 leading-6">
          <div className="font-bold mb-1">تفصيل Risk Penalty</div>
          <div>عتبة الخطر الحرج: Probability × Impact ≥ {risk.criticalThreshold}</div>
          <div>المقام = max(TotalRisks, 1) = {risk.denominator}</div>
          <div>Critical Ratio = {scoreBreakdown.components.criticalRisks}/{risk.denominator} = {risk.criticalRatio}</div>
          <div>Open Ratio = {scoreBreakdown.components.openRisks}/{risk.denominator} = {risk.openRatio}</div>
          <div>Critical Contribution = {risk.criticalContribution}</div>
          <div>Open Contribution = {risk.openContribution}</div>
          <div>قبل السقف = {risk.beforeCap}</div>
          <div className="font-bold">RiskPenalty = min({risk.capValue}, {risk.beforeCap}) = {scoreBreakdown.riskPenalty}</div>
          <div className={`mt-1 font-bold ${risk.capApplied ? 'text-red-700' : 'text-emerald-700'}`}>
            {risk.capApplied ? 'تم تطبيق سقف خصم المخاطر.' : 'لم يتم تطبيق سقف خصم المخاطر.'}
          </div>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-900 leading-6">
          <div className="font-bold mb-1">تفصيل Efficiency Bonus</div>
          <div>عدد مؤشرات الكفاءة المحتسبة: {efficiency.kpiCount}</div>
          <div>Average Achievement = {scoreBreakdown.components.avgEfficiencyAchievement}%</div>
          <div>المعامل = {efficiency.multiplier}</div>
          <div>قبل السقف = {efficiency.beforeCap}</div>
          <div className="font-bold">EfficiencyBonus = min({efficiency.capValue}, {efficiency.beforeCap}) = {scoreBreakdown.efficiencyBonus}</div>
          <div className={`mt-1 font-bold ${efficiency.capApplied ? 'text-green-700' : 'text-emerald-700'}`}>
            {efficiency.capApplied ? 'تم تطبيق سقف مكافأة الكفاءة.' : 'لم يتم تطبيق سقف مكافأة الكفاءة.'}
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 leading-6">
          <div className="font-bold mb-1">تفصيل SLA Penalty</div>
          <div>MTTC = {scoreBreakdown.components.slaMTTC}</div>
          <div>Target = {scoreBreakdown.components.slaMTTCTarget}</div>
          {sla.defaultTargetApplied && <div>تم استخدام الهدف الافتراضي (24 ساعة) لعدم وجود قيمة هدف صالحة.</div>}
          <div>هل تم تفعيل الخصم؟ {sla.wasTriggered ? 'نعم' : 'لا'}</div>
          <div>الفرق فوق الهدف = {sla.deltaOverTarget}</div>
          <div>نسبة التجاوز = {sla.overflowRatio}</div>
          <div>قبل السقف = {sla.beforeCap}</div>
          <div className="font-bold">SlaPenalty = {scoreBreakdown.slaPenalty}</div>
          <div className={`mt-1 font-bold ${sla.capApplied ? 'text-amber-700' : 'text-emerald-700'}`}>
            {sla.capApplied ? 'تم تطبيق سقف خصم SLA.' : 'لم يتم تطبيق سقف خصم SLA.'}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-green-200 bg-green-50/50 px-4 py-3 text-xs text-green-900 mb-3">
        <div className="font-bold mb-2">تفصيل تطبيع مؤشرات الكفاءة (لكل مؤشر)</div>
        {efficiency.normalizedKpis.length === 0 && (
          <div className="text-text-muted">لا توجد مؤشرات كفاءة مدخلة، لذلك متوسط الكفاءة = 0.</div>
        )}
        {efficiency.normalizedKpis.length > 0 && (
          <div className="space-y-1">
            {efficiency.normalizedKpis.map((kpi, index) => (
              <div key={`${kpi.id || kpi.title}-${index}`} className="rounded-lg border border-green-200 bg-white px-3 py-2">
                <div className="font-bold text-green-950">{kpi.title}</div>
                <div>
                  Actual: {kpi.actual} | Target: {kpi.target} | Direction: {kpi.lowerBetter ? 'الاقل افضل' : 'الاعلى افضل'}
                </div>
                <div className="font-bold">Normalized = {kpi.normalized}%</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-900 leading-7">
        <div>النتيجة قبل التقريب: <span className="font-bold">{scoreBreakdown.rawScore}</span></div>
        <div>النتيجة النهائية بعد clamp: <span className="font-[900] text-base">{scoreBreakdown.finalScore}/100</span></div>
        <div>النسخة المستخدمة: <span className="font-bold">{scoreBreakdown.formulaVersion}</span></div>
      </div>

      {showSources && (
        <div className="mt-4 rounded-xl border border-border bg-surface px-4 py-3 text-xs text-text-muted leading-6">
          <div className="font-bold text-text-secondary mb-1">المرجع العلمي والمنهجي</div>
          <div>هذه المعادلة مبنية على مبادئ قياس المخاطر والامن من معايير معروفة، مع اوزان معايرة داخلية خاصة بالمؤسسة.</div>
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
            ملاحظة حوكمة: الاوزان الرقمية (40%/35%/25% وغيرها) هي قرار معايرة داخلي قابل للمراجعة الدورية، وليست رقما الزاميا منصوصا عليه حرفيا في معيار واحد.
          </div>
        </div>
      )}
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
              <p className="text-xs text-text-muted mt-0.5">مخفية افتراضيا لتقليل المساحة. يمكن توسيعها أو فتحها كنافذة.</p>
            </div>
          </div>
          <div className="text-xs font-bold text-navy-900 bg-navy-50 border border-navy-100 rounded-lg px-2.5 py-1.5">
            الدرجة الحالية: {scoreBreakdown.finalScore}/100
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3">
            <Metric label="Governance" value={String(scoreBreakdown.governanceBase)} tone="blue" />
            <Metric label="Risk" value={`-${scoreBreakdown.riskPenalty}`} tone="red" />
            <Metric label="Efficiency" value={`+${scoreBreakdown.efficiencyBonus}`} tone="green" />
            <Metric label="SLA" value={`-${scoreBreakdown.slaPenalty}`} tone="amber" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowInlineDetails((prev) => !prev);
                setShowModal(false);
              }}
              className="text-xs font-bold bg-white border border-border rounded-lg px-3 py-1.5 text-navy-800 hover:bg-navy-50 transition-colors"
            >
              {showInlineDetails ? 'طي التفاصيل' : 'توسيع داخل الصفحة'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowModal(true);
                setShowInlineDetails(false);
              }}
              className="text-xs font-bold bg-navy-900 border border-navy-900 rounded-lg px-3 py-1.5 text-white hover:bg-navy-800 transition-colors"
            >
              فتح كنافذة مستقلة
            </button>
          </div>

          {showInlineDetails && (
            <div className="mt-4 border-t border-border pt-4">
              {details}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-[1px] p-4 flex items-center justify-center"
          onClick={() => {
            setShowModal(false);
            setShowSources(false);
          }}
        >
          <div
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-border shadow-2xl"
            dir="rtl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-[900] text-navy-950">تفاصيل حساب الدرجة العالمية</h3>
                <p className="text-xs text-text-muted mt-0.5">يمكن اغلاق النافذة في اي وقت بدون التأثير على البيانات.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setShowSources(false);
                }}
                className="w-9 h-9 rounded-xl border border-border text-text-muted hover:bg-red-50 hover:text-danger-500 transition-colors"
                aria-label="اغلاق"
              >
                ×
              </button>
            </div>
            <div className="p-5">{details}</div>
          </div>
        </div>
      )}
    </>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'blue' | 'red' | 'green' | 'amber';
}) {
  const classMap: Record<typeof tone, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    green: 'border-green-200 bg-green-50 text-green-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
  };

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${classMap[tone]}`}>
      <div className="text-[11px] opacity-75">{label}</div>
      <div className="text-sm font-[900] mt-0.5">{value}</div>
    </div>
  );
}
