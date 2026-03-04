'use client';

import { useReportStore } from '@/store/reportStore';
import { SECURITY_LEVELS, TRENDS, getScoreColorClass } from '@/lib/constants';
import { FormCard, FormField } from './GeneralInfoForm';

export default function ExecutiveSummaryForm() {
  const { report, updateField, addDecision, updateDecision, removeDecision } = useReportStore();
  if (!report) return null;

  const scoreColor = getScoreColorClass(report.securityScore);

  return (
    <div className="animate-fadeIn">
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
            <label className="text-sm font-bold text-text-secondary">درجة الأمن (من 100)</label>
            <div className="flex items-center gap-2.5">
              <input
                type="range"
                min="0"
                max="100"
                value={report.securityScore}
                onChange={(e) => updateField('securityScore', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className={`text-base font-[900] px-3 py-1 rounded-lg ${scoreColor.bg} ${scoreColor.text}`}>
                {report.securityScore}
              </span>
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

      <FormCard icon="⚠️" title="القرارات المطلوبة من الإدارة">
        <div className="bg-navy-100 border border-blue-200 rounded-xl py-3 px-4 text-sm text-navy-800 mb-4">
          💡 أدخل القرارات التي تحتاج موافقة أو توجيه من الإدارة العليا.
        </div>

        {report.decisions.map((dec, i) => (
          <div key={dec.id} className="bg-surface border border-border/60 rounded-2xl p-5 mb-3 relative animate-fadeIn shadow-sm hover:shadow-md transition-all duration-200">
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
              <div className="grid grid-cols-2 gap-4">
                <FormField label="الميزانية (₪)" value={dec.budget} onChange={(v) => updateDecision(i, { budget: v })} />
                <FormField label="الإطار الزمني" value={dec.timeline} onChange={(v) => updateDecision(i, { timeline: v })} />
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
