'use client';

import { useReportStore } from '@/store/reportStore';
import { FormCard, FormField } from './GeneralInfoForm';

export default function SLAForm() {
  const { report, updateField } = useReportStore();
  if (!report) return null;

  const slaItems = [
    { code: 'MTTD', label: 'وقت الاكتشاف', val: report.slaMTTD, target: report.slaMTTDTarget, valKey: 'slaMTTD' as const, tgtKey: 'slaMTTDTarget' as const, hint: 'الهدف: < 2 ساعة' },
    { code: 'MTTR', label: 'وقت الاستجابة', val: report.slaMTTR, target: report.slaMTTRTarget, valKey: 'slaMTTR' as const, tgtKey: 'slaMTTRTarget' as const, hint: 'الهدف: < 8 ساعات' },
    { code: 'MTTC', label: 'وقت الاحتواء', val: report.slaMTTC, target: report.slaMTTCTarget, valKey: 'slaMTTC' as const, tgtKey: 'slaMTTCTarget' as const, hint: 'الهدف: < 24 ساعة' },
  ];

  return (
    <div className="animate-fadeIn">
      <FormCard icon="⏱️" title="مقاييس الاستجابة للحوادث (SLA)">
        <div className="grid grid-cols-3 gap-2.5 mb-3">
          {slaItems.map((item) => (
            <FormField
              key={item.code}
              label={`${item.code} – ${item.label} (ساعة)`}
              value={item.val}
              onChange={(v) => updateField(item.valKey, parseFloat(v) || 0)}
              type="number"
              hint={item.hint}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-3">
          {slaItems.map((item) => (
            <FormField
              key={`${item.code}-target`}
              label={`هدف ${item.label}`}
              value={item.target}
              onChange={(v) => updateField(item.tgtKey, parseFloat(v) || 0)}
              type="number"
            />
          ))}
        </div>

        {/* Live gauge preview */}
        <div className="grid grid-cols-3 gap-2.5 mb-3">
          {slaItems.map((item) => {
            const pct = item.target > 0 ? Math.min(100, Math.round((item.val / item.target) * 100)) : 0;
            const ok = item.val <= item.target;
            return (
              <div key={`gauge-${item.code}`} className={`border rounded-lg overflow-hidden ${ok ? 'border-green-300' : 'border-red-300'}`}>
                <div className={`py-1.5 px-2.5 text-[9px] font-bold text-center ${ok ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-500'}`}>
                  {ok ? '✅ ضمن الهدف' : '⚠️ تجاوز الهدف'} – {item.code}
                </div>
                <div className="py-2.5 px-2.5 text-center">
                  <div className={`text-xl font-[900] ${ok ? 'text-success-700' : 'text-danger-500'}`}>{item.val}</div>
                  <div className="text-[9px] text-text-muted">ساعة</div>
                  <div className="bg-gray-100 rounded-sm h-[5px] overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-sm transition-all ${ok ? 'bg-success-700' : 'bg-danger-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="نسبة الحل ضمن SLA %" value={report.slaRate} onChange={(v) => updateField('slaRate', parseFloat(v) || 0)} type="number" />
          <FormField label="حوادث تجاوزت SLA" value={report.slaBreach} onChange={(v) => updateField('slaBreach', parseInt(v) || 0)} type="number" />
        </div>
      </FormCard>
    </div>
  );
}
