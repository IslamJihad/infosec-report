'use client';

import { useReportStore } from '@/store/reportStore';
import { FormCard, FormField } from './GeneralInfoForm';

export default function EfficiencyForm() {
  const { report, addEfficiencyKPI, updateEfficiencyKPI, removeEfficiencyKPI } = useReportStore();
  if (!report) return null;

  const kpis = report.efficiencyKPIs || [];

  return (
    <div className="animate-fadeIn">
      <FormCard icon="⚡" title="مؤشرات الكفاءة التشغيلية">
        <div className="bg-navy-100 border border-blue-200 rounded-xl py-3 px-4 text-sm text-navy-800 mb-4">
          📈 هذه المؤشرات تقيس فاعلية الفريق الأمني في تحويل الاستثمار إلى نتائج حقيقية قابلة للقياس.
        </div>

        {kpis.length === 0 && (
          <div className="text-center py-8 text-text-muted text-sm">
            <div className="text-4xl mb-2">⚡</div>
            <div>لا توجد مؤشرات بعد. أضف أول مؤشر!</div>
          </div>
        )}

        {kpis.map((kpi, i) => {
          const pct = kpi.target > 0 ? Math.round((kpi.val / kpi.target) * 100) : 0;
          const isGood = kpi.lowerBetter ? kpi.val <= kpi.target : kpi.val >= kpi.target;
          const barColor = isGood ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-400';
          const barWidth = Math.min(100, pct);

          return (
            <div key={kpi.id} className="bg-surface border border-border/60 rounded-2xl p-5 mb-3 relative animate-fadeIn shadow-sm hover:shadow-md transition-all duration-200">
              <button
                onClick={() => removeEfficiencyKPI(i)}
                className="absolute top-3 left-3 bg-danger-100 text-danger-500 border border-red-200 rounded-xl w-7 h-7 cursor-pointer text-sm flex items-center justify-center hover:bg-red-200 transition-all duration-200"
              >
                ×
              </button>
              <div className="pr-0 pl-10">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <FormField
                    label="اسم المؤشر"
                    value={kpi.title}
                    onChange={(v) => updateEfficiencyKPI(i, { title: v })}
                  />
                  <FormField
                    label="وصف قصير"
                    value={kpi.description}
                    onChange={(v) => updateEfficiencyKPI(i, { description: v })}
                  />
                </div>
                <div className="grid grid-cols-4 gap-4 mb-3">
                  <FormField
                    label="القيمة الحالية"
                    value={kpi.val}
                    onChange={(v) => updateEfficiencyKPI(i, { val: parseFloat(v) || 0 })}
                    type="number"
                  />
                  <FormField
                    label="الهدف المستهدف"
                    value={kpi.target}
                    onChange={(v) => updateEfficiencyKPI(i, { target: parseFloat(v) || 100 })}
                    type="number"
                  />
                  <FormField
                    label="الوحدة"
                    value={kpi.unit}
                    onChange={(v) => updateEfficiencyKPI(i, { unit: v })}
                  />
                  <div className="flex flex-col gap-1.5 justify-end">
                    <label className="text-sm font-bold text-text-secondary">الأفضل &quot;أقل&quot;؟</label>
                    <button
                      onClick={() => updateEfficiencyKPI(i, { lowerBetter: !kpi.lowerBetter })}
                      className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all duration-200 border ${
                        kpi.lowerBetter
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {kpi.lowerBetter ? '↓ الأقل أفضل' : '↑ الأعلى أفضل'}
                    </button>
                  </div>
                </div>
                {/* Progress bar preview */}
                <div className="bg-white border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-text-muted">الإنجاز</span>
                    <span className={`text-sm font-[900] ${isGood ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {kpi.val} {kpi.unit} / {kpi.target} {kpi.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={addEfficiencyKPI}
          className="flex items-center gap-2 bg-navy-50 text-navy-800 border-2 border-dashed border-navy-200 rounded-2xl py-3 px-4 cursor-pointer text-sm font-bold w-full justify-center transition-all duration-200 hover:bg-navy-100 hover:border-navy-600 hover:shadow-sm"
        >
          + إضافة مؤشر كفاءة
        </button>
      </FormCard>
    </div>
  );
}
