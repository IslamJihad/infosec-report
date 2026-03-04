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
        <div className="bg-navy-100 border border-blue-200 rounded-[7px] py-2 px-3 text-[10px] text-navy-800 mb-2.5">
          🎯 درجة المخاطرة = الاحتمالية × التأثير (1–5).
        </div>

        {report.risks.map((risk, i) => {
          const score = risk.probability * risk.impact;
          const scoreClass = getRiskScoreClass(score);
          return (
            <div key={risk.id} className="bg-surface border border-border rounded-lg p-3 mb-2 relative animate-fadeIn">
              <button
                onClick={() => removeRisk(i)}
                className="absolute top-2 left-2 bg-danger-100 text-danger-500 border-none rounded-md w-5 h-5 cursor-pointer text-xs flex items-center justify-center hover:bg-red-200 transition-colors"
              >
                ×
              </button>
              <div className="pr-0 pl-7">
                <div className="grid grid-cols-2 gap-2.5 mb-2">
                  <FormField label="وصف الخطر / الثغرة" value={risk.description} onChange={(v) => updateRisk(i, { description: v })} />
                  <FormField label="النظام المتأثر" value={risk.system} onChange={(v) => updateRisk(i, { system: v })} />
                </div>
                <div className="grid grid-cols-3 gap-2.5 mb-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-text-secondary">مستوى الخطورة</label>
                    <select
                      value={risk.severity}
                      onChange={(e) => updateRisk(i, { severity: e.target.value as 'critical' | 'high' | 'medium' | 'low' })}
                      className="border-[1.5px] border-border rounded-[7px] py-[7px] px-2.5 font-[Cairo] text-[11px] outline-none focus:border-navy-800 bg-white"
                    >
                      {Object.entries(SEVERITY_MAP).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-text-secondary">الحالة</label>
                    <select
                      value={risk.status}
                      onChange={(e) => updateRisk(i, { status: e.target.value as 'open' | 'inprogress' | 'closed' })}
                      className="border-[1.5px] border-border rounded-[7px] py-[7px] px-2.5 font-[Cairo] text-[11px] outline-none focus:border-navy-800 bg-white"
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
                <div className="grid grid-cols-2 gap-2.5">
                  <FormField
                    label="التأثير (1-5)"
                    value={risk.impact}
                    onChange={(v) => updateRisk(i, { impact: Math.min(5, Math.max(1, parseInt(v) || 1)) })}
                    type="number"
                    min={1}
                    max={5}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-text-secondary">درجة المخاطرة</label>
                    <div className={`flex items-center justify-center rounded-[7px] py-[7px] font-[Cairo] text-sm font-[900] ${scoreClass}`}>
                      {score}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={addRisk}
          className="flex items-center gap-1.5 bg-navy-100/50 text-navy-800 border-[1.5px] border-dashed border-blue-300 rounded-[7px] py-2 px-3 cursor-pointer font-[Cairo] text-[11px] font-bold w-full justify-center transition-colors hover:bg-navy-100"
        >
          + إضافة خطر / ثغرة
        </button>
      </FormCard>
    </div>
  );
}
