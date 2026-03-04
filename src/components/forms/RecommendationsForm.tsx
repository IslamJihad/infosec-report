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
          <div key={rec.id} className="bg-surface border border-border/60 rounded-2xl p-5 mb-3 relative animate-fadeIn shadow-sm hover:shadow-md transition-all duration-200">
            <button
              onClick={() => removeRecommendation(i)}
              className="absolute top-3 left-3 bg-danger-100 text-danger-500 border border-red-200 rounded-xl w-7 h-7 cursor-pointer text-sm flex items-center justify-center hover:bg-red-200 transition-all duration-200"
            >
              ×
            </button>
            <div className="pr-0 pl-10">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <FormField label="عنوان التوصية" value={rec.title} onChange={(v) => updateRecommendation(i, { title: v })} />
                <FormField label="الجهة المسؤولة" value={rec.department} onChange={(v) => updateRecommendation(i, { department: v })} />
              </div>
              <div className="mb-3">
                <label className="text-sm font-bold text-text-secondary block mb-2">التفاصيل</label>
                <textarea
                  value={rec.description}
                  onChange={(e) => updateRecommendation(i, { description: e.target.value })}
                  rows={2}
                  className="w-full border-[1.5px] border-border rounded-xl py-3 px-4 text-sm outline-none focus:border-navy-700 focus:shadow-[0_0_0_3px_rgba(26,58,124,0.1)] resize-y min-h-[64px] hover:border-navy-200 transition-all duration-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-text-secondary">الأولوية</label>
                  <select
                    value={rec.priority}
                    onChange={(e) => updateRecommendation(i, { priority: e.target.value as 'high' | 'medium' | 'low' })}
                    className="border-[1.5px] border-border rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-navy-700 focus:shadow-[0_0_0_3px_rgba(26,58,124,0.1)] bg-white hover:border-navy-200 transition-all duration-200"
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
          className="flex items-center gap-2 bg-navy-50 text-navy-800 border-2 border-dashed border-navy-200 rounded-2xl py-3 px-4 cursor-pointer text-sm font-bold w-full justify-center transition-all duration-200 hover:bg-navy-100 hover:border-navy-600 hover:shadow-sm"
        >
          + إضافة توصية
        </button>
      </FormCard>
    </div>
  );
}
