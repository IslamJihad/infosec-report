'use client';

import { useReportStore } from '@/store/reportStore';
import { FormCard, FormField } from './GeneralInfoForm';

export default function SLAForm() {
  const { report, updateField } = useReportStore();
  if (!report) return null;

  const slaItems = [
    { code: 'MTTC', label: 'وقت الاحتواء', val: report.slaMTTC, target: report.slaMTTCTarget, valKey: 'slaMTTC' as const, tgtKey: 'slaMTTCTarget' as const, hint: 'الهدف: < 24 ساعة' },
  ];

  return (
    <div className="animate-fadeIn">
      <FormCard icon="⏱️" title="مقاييس الاستجابة للحوادث (SLA)">
        <div className="grid grid-cols-3 gap-4 mb-4">
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

        <div className="grid grid-cols-3 gap-4 mb-4">
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
        <div className="grid grid-cols-3 gap-4 mb-4">
          {slaItems.map((item) => {
            const pct = item.target > 0 ? Math.min(100, Math.round((item.val / item.target) * 100)) : 0;
            const ok = item.val <= item.target;
            return (
              <div key={`gauge-${item.code}`} className={`border rounded-2xl overflow-hidden shadow-sm ${ok ? 'border-green-300' : 'border-red-300'}`}>
                <div className={`py-2 px-3 text-xs font-bold text-center ${ok ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-500'}`}>
                  {ok ? '✅ ضمن الهدف' : '⚠️ تجاوز الهدف'} – {item.code}
                </div>
                <div className="py-4 px-3 text-center">
                  <div className={`text-2xl font-[900] ${ok ? 'text-success-700' : 'text-danger-500'}`}>{item.val}</div>
                  <div className="text-xs text-text-muted mt-0.5">ساعة</div>
                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all ${ok ? 'bg-success-700' : 'bg-danger-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </FormCard>
    </div>
  );
}
