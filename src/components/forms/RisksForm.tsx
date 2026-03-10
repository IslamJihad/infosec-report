'use client';

import { useReportStore } from '@/store/reportStore';
import { SEVERITY_MAP, STATUS_MAP, getRiskScoreClass } from '@/lib/constants';
import { FormCard, FormField } from './GeneralInfoForm';

export default function RisksForm() {
  const { report, addRisk, updateRisk, removeRisk } = useReportStore();
  if (!report) return null;

  return (
    <div className="animate-fadeIn">
      <FormCard icon="⚠️" title="أبرز المخاطر والثغرات">
        <div className="bg-navy-100 border border-blue-200 rounded-xl py-3 px-4 text-sm text-navy-800 mb-4">
          🎯 درجة المخاطرة = الاحتمالية × التأثير (1–5).
        </div>

        {report.risks.map((risk, i) => {
          const score = risk.probability * risk.impact;
          const scoreClass = getRiskScoreClass(score);
          return (
            <div key={risk.id} className="bg-surface border border-border/60 rounded-2xl p-5 mb-3 relative animate-fadeIn shadow-sm hover:shadow-md transition-all duration-200">
              <button
                onClick={() => removeRisk(i)}
                className="absolute top-3 left-3 bg-danger-100 text-danger-500 border border-red-200 rounded-xl w-7 h-7 cursor-pointer text-sm flex items-center justify-center hover:bg-red-200 transition-all duration-200"
              >
                ×
              </button>
              <div className="pr-0 pl-10">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <FormField label="وصف الخطر / الثغرة" value={risk.description} onChange={(v) => updateRisk(i, { description: v })} />
                  <FormField label="النظام المتأثر" value={risk.system} onChange={(v) => updateRisk(i, { system: v })} />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-text-secondary">مستوى الخطورة</label>
                    <select
                      value={risk.severity}
                      onChange={(e) => updateRisk(i, { severity: e.target.value as 'critical' | 'high' | 'medium' | 'low' })}
                      className="border-[1.5px] border-border rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-navy-700 focus:shadow-[0_0_0_3px_rgba(26,58,124,0.1)] bg-white hover:border-navy-200 transition-all duration-200"
                    >
                      {Object.entries(SEVERITY_MAP).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-text-secondary">الحالة</label>
                    <select
                      value={risk.status}
                      onChange={(e) => updateRisk(i, { status: e.target.value as 'open' | 'inprogress' | 'closed' })}
                      className="border-[1.5px] border-border rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-navy-700 focus:shadow-[0_0_0_3px_rgba(26,58,124,0.1)] bg-white hover:border-navy-200 transition-all duration-200"
                    >
                      {Object.entries(STATUS_MAP).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <FormField
                    label="الاحتمالية (1-5)"
                    value={risk.probability}
                    onChange={(v) => updateRisk(i, { probability: Math.min(5, Math.max(1, parseInt(v) || 1)) })}
                    type="number"
                    min={1}
                    max={5}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <FormField
                    label="التأثير (1-5)"
                    value={risk.impact}
                    onChange={(v) => updateRisk(i, { impact: Math.min(5, Math.max(1, parseInt(v) || 1)) })}
                    type="number"
                    min={1}
                    max={5}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-text-secondary">درجة المخاطرة</label>
                    <div className={`flex items-center justify-center rounded-xl py-2.5 text-base font-[900] ${scoreClass}`}>
                      {score}
                    </div>
                  </div>
                </div>
                <FormField
                  label="أسوأ سيناريو محتمل"
                  value={risk.worstCase || ''}
                  onChange={(v) => updateRisk(i, { worstCase: v })}
                />
              </div>
            </div>
          );
        })}

        <button
          onClick={addRisk}
          className="flex items-center gap-2 bg-navy-50 text-navy-800 border-2 border-dashed border-navy-200 rounded-2xl py-3 px-4 cursor-pointer text-sm font-bold w-full justify-center transition-all duration-200 hover:bg-navy-100 hover:border-navy-600 hover:shadow-sm"
        >
          + إضافة خطر / ثغرة
        </button>
      </FormCard>
    </div>
  );
}
