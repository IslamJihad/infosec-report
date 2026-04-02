'use client';

import { useReportStore } from '@/store/reportStore';
import { FormCard, FormField } from './GeneralInfoForm';

export default function ROIBenchmarkForm() {
  const { report, updateField } = useReportStore();
  if (!report) return null;

  return (
    <div className="animate-fadeIn">
      <FormCard icon="💰" title="فعالية الاستثمار الأمني">
        <div className="bg-navy-100 border border-blue-200 rounded-xl py-3 px-4 text-sm text-navy-800 mb-4">
          📍 هل الأموال المُنفَقة تحقق الغرض؟ قِس العائد من خلال الثغرات المعالجة ومقارنة الأداء بالقطاع.
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <FormField
            label="ثغرات تمت معالجتها هذه الفترة"
            value={report.vulnResolved}
            onChange={(v) => updateField('vulnResolved', parseInt(v) || 0)}
            type="number"
            hint="من إجمالي الثغرات المكتشفة"
          />
          <FormField
            label="حوادث من نفس نوع سابق (تكرار)"
            value={report.vulnRecurring}
            onChange={(v) => updateField('vulnRecurring', parseInt(v) || 0)}
            type="number"
            hint="يقيس ما إذا كنا نحل الجذور"
          />
        </div>
      </FormCard>

      <FormCard icon="📍" title="موقعنا مقارنةً بالقطاع (Benchmark)">
        <div className="bg-navy-100 border border-blue-200 rounded-xl py-3 px-4 text-sm text-navy-800 mb-4">
          📊 بدون سياق، الأرقام لا تعني شيئاً. قارن أداءك بمتوسط القطاع.
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <FormField
            label="متوسط درجة الأمن في القطاع (/ 100)"
            value={report.bmScore}
            onChange={(v) => updateField('bmScore', parseInt(v) || 0)}
            type="number"
          />
          <FormField
            label="متوسط نسبة الامتثال في القطاع %"
            value={report.bmCompliance}
            onChange={(v) => updateField('bmCompliance', parseInt(v) || 0)}
            type="number"
          />
        </div>
        <FormField
          label="مصدر المقارنة / اسم القطاع"
          value={report.bmSector}
          onChange={(v) => updateField('bmSector', v)}
        />
      </FormCard>
    </div>
  );
}
