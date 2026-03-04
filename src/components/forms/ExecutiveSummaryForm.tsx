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
        <div className="mb-2.5">
          <label className="text-[10px] font-bold text-text-secondary block mb-1">نص الملخص</label>
          <textarea
            value={report.summary}
            onChange={(e) => updateField('summary', e.target.value)}
            rows={5}
            className="w-full border-[1.5px] border-border rounded-[7px] py-[7px] px-2.5 font-[Cairo] text-[11px] text-text-primary outline-none transition-colors focus:border-navy-800 resize-y min-h-[64px]"
            placeholder="أدخل ملخصاً تنفيذياً شاملاً عن الوضع الأمني..."
          />
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-secondary">المستوى العام</label>
            <select
              value={report.securityLevel}
              onChange={(e) => updateField('securityLevel', e.target.value)}
              className="border-[1.5px] border-border rounded-[7px] py-[7px] px-2.5 font-[Cairo] text-[11px] outline-none focus:border-navy-800 bg-white"
            >
              {SECURITY_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-secondary">درجة الأمن (من 100)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={report.securityScore}
                onChange={(e) => updateField('securityScore', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className={`text-sm font-[900] px-2 py-0.5 rounded ${scoreColor.bg} ${scoreColor.text}`}>
                {report.securityScore}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-secondary">الاتجاه</label>
            <select
              value={report.trend}
              onChange={(e) => updateField('trend', e.target.value)}
              className="border-[1.5px] border-border rounded-[7px] py-[7px] px-2.5 font-[Cairo] text-[11px] outline-none focus:border-navy-800 bg-white"
            >
              {TRENDS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </FormCard>

      <FormCard icon="⚠️" title="القرارات المطلوبة من الإدارة">
        <div className="bg-navy-100 border border-blue-200 rounded-[7px] py-2 px-3 text-[10px] text-navy-800 mb-2.5">
          💡 أدخل القرارات التي تحتاج موافقة أو توجيه من الإدارة العليا.
        </div>

        {report.decisions.map((dec, i) => (
          <div key={dec.id} className="bg-surface border border-border rounded-lg p-3 mb-2 relative animate-fadeIn">
            <button
              onClick={() => removeDecision(i)}
              className="absolute top-2 left-2 bg-danger-100 text-danger-500 border-none rounded-md w-5 h-5 cursor-pointer text-xs flex items-center justify-center hover:bg-red-200 transition-colors"
            >
              ×
            </button>
            <div className="pr-0 pl-7">
              <div className="grid grid-cols-2 gap-2.5 mb-2">
                <FormField label="عنوان القرار" value={dec.title} onChange={(v) => updateDecision(i, { title: v })} />
                <FormField label="الجهة المسؤولة" value={dec.department} onChange={(v) => updateDecision(i, { department: v })} />
              </div>
              <div className="mb-2">
                <label className="text-[10px] font-bold text-text-secondary block mb-1">التفاصيل</label>
                <textarea
                  value={dec.description}
                  onChange={(e) => updateDecision(i, { description: e.target.value })}
                  rows={2}
                  className="w-full border-[1.5px] border-border rounded-[7px] py-[7px] px-2.5 font-[Cairo] text-[11px] outline-none focus:border-navy-800 resize-y min-h-[48px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <FormField label="الميزانية (₪)" value={dec.budget} onChange={(v) => updateDecision(i, { budget: v })} />
                <FormField label="الإطار الزمني" value={dec.timeline} onChange={(v) => updateDecision(i, { timeline: v })} />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addDecision}
          className="flex items-center gap-1.5 bg-navy-100/50 text-navy-800 border-[1.5px] border-dashed border-blue-300 rounded-[7px] py-2 px-3 cursor-pointer font-[Cairo] text-[11px] font-bold w-full justify-center transition-colors hover:bg-navy-100"
        >
          + إضافة قرار
        </button>
      </FormCard>
    </div>
  );
}
