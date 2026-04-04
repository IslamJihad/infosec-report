'use client';

import { useState } from 'react';
import type { ReportData } from '@/types/report';
import { calculateGlobalSecurityScore } from '@/lib/scoring';

interface Props {
  report: ReportData;
}

export default function MethodologySummaryCard({ report }: Props) {
  const [showSources, setShowSources] = useState(false);
  const scoreBreakdown = report.scoreBreakdown ?? calculateGlobalSecurityScore(report).scoreBreakdown;

  return (
    <div className="bg-white rounded-2xl border border-border/60 mb-5 overflow-hidden shadow-md" dir="rtl">
      <div className="bg-gradient-to-l from-navy-50 to-white py-4 px-5 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-navy-800 to-navy-900 text-white w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 shadow-sm">
            🧪
          </div>
          <div>
            <h3 className="text-base font-[800] text-navy-950">القيم المستخدمة في حساب الدرجة (تظهر في كل صفحة)</h3>
            <p className="text-xs text-text-muted mt-0.5">هذه هي الارقام الفعلية الداخلة في المعادلة لهذا التقرير حاليا.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowSources((prev) => !prev)}
          className="text-xs font-bold bg-white border border-border rounded-lg px-3 py-1.5 text-navy-800 hover:bg-navy-50 transition-colors"
        >
          {showSources ? 'اخفاء المراجع' : 'عرض المراجع والمنهجية'}
        </button>
      </div>

      <div className="p-5">
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-navy-900 mb-4 leading-6">
          المعادلة: Score = clamp(round((0.40×Compliance + 0.35×Maturity + 0.25×Assets) - RiskPenalty + EfficiencyBonus - SlaPenalty), 0, 100)
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
      </div>
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
