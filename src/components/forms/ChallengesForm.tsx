'use client';

import { useReportStore } from '@/store/reportStore';
import { CHALLENGE_TYPES } from '@/lib/constants';
import { FormCard, FormField } from './GeneralInfoForm';

export default function ChallengesForm() {
  const { report, addChallenge, updateChallenge, removeChallenge } = useReportStore();
  if (!report) return null;

  return (
    <div className="animate-fadeIn">
      <FormCard icon="🚧" title="التحديات والعوائق الحقيقية">
        <div className="bg-navy-100 border border-blue-200 rounded-xl py-3 px-4 text-sm text-navy-800 mb-4">
          ⚡ هذا هو أكثر قسم يُهمل في التقارير الأمنية. كن صريحاً: أدخل المعوقات الحقيقية وما تحتاجه لتجاوزها. هذا ما يحوّل التقرير من &quot;إشعار&quot; إلى &quot;أداة قرار&quot;.
        </div>

        {report.challenges.map((challenge, i) => (
          <div key={challenge.id} className="bg-surface border border-border/60 rounded-2xl p-5 mb-3 relative animate-fadeIn shadow-sm hover:shadow-md transition-all duration-200">
            <button
              onClick={() => removeChallenge(i)}
              className="absolute top-3 left-3 bg-danger-100 text-danger-500 border border-red-200 rounded-xl w-7 h-7 cursor-pointer text-sm flex items-center justify-center hover:bg-red-200 transition-all duration-200"
            >
              ×
            </button>
            <div className="pr-0 pl-10">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <FormField label="عنوان التحدي" value={challenge.title} onChange={(v) => updateChallenge(i, { title: v })} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-text-secondary">نوع التحدي</label>
                  <select
                    value={challenge.type}
                    onChange={(e) => updateChallenge(i, { type: e.target.value as 'budget' | 'staff' | 'tech' | 'process' })}
                    className="border-[1.5px] border-border rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-navy-700 focus:shadow-[0_0_0_3px_var(--color-focus-ring)] bg-[color:var(--surface-elevated)] hover:border-navy-200 transition-all duration-200"
                  >
                    {Object.entries(CHALLENGE_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="السبب الجذري" value={challenge.rootCause} onChange={(v) => updateChallenge(i, { rootCause: v })} />
                <FormField label="ما نحتاجه لتجاوزه" value={challenge.requirement} onChange={(v) => updateChallenge(i, { requirement: v })} />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addChallenge}
          className="flex items-center gap-2 bg-navy-50 text-navy-800 border-2 border-dashed border-navy-200 rounded-2xl py-3 px-4 cursor-pointer text-sm font-bold w-full justify-center transition-all duration-200 hover:bg-navy-100 hover:border-navy-600 hover:shadow-sm"
        >
          + إضافة تحدي / عائق
        </button>
      </FormCard>
    </div>
  );
}
