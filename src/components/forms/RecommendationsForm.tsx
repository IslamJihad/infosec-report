'use client';

import { useReportStore } from '@/store/reportStore';
import { PRIORITY_MAP } from '@/lib/constants';
import { FormCard, FormField } from './GeneralInfoForm';

export default function RecommendationsForm() {
  const { report, addRecommendation, updateRecommendation, removeRecommendation } = useReportStore();
  if (!report) return null;

  return (
    <div className="animate-fadeIn">
      <FormCard icon="✅" title="التوصيات وخارطة الطريق">
        {report.recommendations.map((rec, i) => (
          <div key={rec.id} className="bg-surface border border-border rounded-lg p-3 mb-2 relative animate-fadeIn">
            <button
              onClick={() => removeRecommendation(i)}
              className="absolute top-2 left-2 bg-danger-100 text-danger-500 border-none rounded-md w-5 h-5 cursor-pointer text-xs flex items-center justify-center hover:bg-red-200 transition-colors"
            >
              ×
            </button>
            <div className="pr-0 pl-7">
              <div className="grid grid-cols-2 gap-2.5 mb-2">
                <FormField label="عنوان التوصية" value={rec.title} onChange={(v) => updateRecommendation(i, { title: v })} />
                <FormField label="الجهة المسؤولة" value={rec.department} onChange={(v) => updateRecommendation(i, { department: v })} />
              </div>
              <div className="mb-2">
                <label className="text-[10px] font-bold text-text-secondary block mb-1">التفاصيل</label>
                <textarea
                  value={rec.description}
                  onChange={(e) => updateRecommendation(i, { description: e.target.value })}
                  rows={2}
                  className="w-full border-[1.5px] border-border rounded-[7px] py-[7px] px-2.5 font-[Cairo] text-[11px] outline-none focus:border-navy-800 resize-y min-h-[48px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-secondary">الأولوية</label>
                  <select
                    value={rec.priority}
                    onChange={(e) => updateRecommendation(i, { priority: e.target.value as 'high' | 'medium' | 'low' })}
                    className="border-[1.5px] border-border rounded-[7px] py-[7px] px-2.5 font-[Cairo] text-[11px] outline-none focus:border-navy-800 bg-white"
                  >
                    {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <FormField label="الجدول الزمني" value={rec.timeline} onChange={(v) => updateRecommendation(i, { timeline: v })} />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addRecommendation}
          className="flex items-center gap-1.5 bg-navy-100/50 text-navy-800 border-[1.5px] border-dashed border-blue-300 rounded-[7px] py-2 px-3 cursor-pointer font-[Cairo] text-[11px] font-bold w-full justify-center transition-colors hover:bg-navy-100"
        >
          + إضافة توصية
        </button>
      </FormCard>
    </div>
  );
}
