'use client';

import { useReportStore } from '@/store/reportStore';
import { FormCard, FormField } from './GeneralInfoForm';
import { getDeltaInfo } from '@/lib/constants';

export default function KPIForm() {
  const { report, updateField } = useReportStore();
  if (!report) return null;

  return (
    <div className="animate-fadeIn">
      <FormCard icon="📊" title="مؤشرات الأداء الرئيسية">
        <div className="bg-navy-100 border border-blue-200 rounded-xl py-3 px-4 text-sm text-navy-800 mb-4">
          📈 أدخل القيم الحالية والسابقة لإظهار اتجاه التحسن أو التراجع.
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Current Values */}
          <div>
            <p className="text-sm font-[800] text-navy-950 mb-3">القيم الحالية</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FormField label="حوادث حرجة" value={report.kpiCritical} onChange={(v) => updateField('kpiCritical', parseInt(v) || 0)} type="number" />
              <FormField label="ثغرات مكتشفة" value={report.kpiVuln} onChange={(v) => updateField('kpiVuln', parseInt(v) || 0)} type="number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="إجمالي الحوادث" value={report.kpiTotal} onChange={(v) => updateField('kpiTotal', parseInt(v) || 0)} type="number" />
              <FormField label="نسبة الامتثال %" value={report.kpiCompliance} onChange={(v) => updateField('kpiCompliance', parseInt(v) || 0)} type="number" />
            </div>
          </div>

          {/* Previous Values */}
          <div>
            <p className="text-sm font-[800] text-navy-950 mb-3">قيم الفترة السابقة</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FormField label="حوادث حرجة" value={report.prevCritical} onChange={(v) => updateField('prevCritical', parseInt(v) || 0)} type="number" />
              <FormField label="ثغرات مكتشفة" value={report.prevVuln} onChange={(v) => updateField('prevVuln', parseInt(v) || 0)} type="number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="إجمالي الحوادث" value={report.prevTotal} onChange={(v) => updateField('prevTotal', parseInt(v) || 0)} type="number" />
              <FormField label="نسبة الامتثال %" value={report.prevCompliance} onChange={(v) => updateField('prevCompliance', parseInt(v) || 0)} type="number" />
            </div>
          </div>
        </div>

        {/* Live Delta Preview */}
        <div className="mt-4 p-4 bg-navy-50 rounded-2xl border border-border">
          <p className="text-xs font-bold text-text-muted mb-3">معاينة التغيير</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'حوادث حرجة', current: report.kpiCritical, prev: report.prevCritical, lower: true },
              { label: 'ثغرات', current: report.kpiVuln, prev: report.prevVuln, lower: true },
              { label: 'إجمالي', current: report.kpiTotal, prev: report.prevTotal, lower: true },
              { label: 'امتثال', current: report.kpiCompliance, prev: report.prevCompliance, lower: false },
            ].map((item) => {
              const info = getDeltaInfo(item.current, item.prev, item.lower);
              return (
                <div key={item.label} className="text-center p-2 bg-white rounded-xl">
                  <div className="text-2xl font-[900] text-navy-950">{item.current}</div>
                  <div className="text-xs text-text-muted mt-0.5">{item.label}</div>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-lg mt-1.5 font-bold ${info.colorClass}`}>
                    {info.arrow} {info.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <hr className="my-4 border-none border-t border-border" />

        <div className="grid grid-cols-2 gap-5">
          {/* Vulnerability Distribution */}
          <div>
            <p className="text-sm font-[800] text-navy-950 mb-3">توزيع الثغرات</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FormField label="🔴 حرجة" value={report.vulnCritical} onChange={(v) => updateField('vulnCritical', parseInt(v) || 0)} type="number" />
              <FormField label="🟠 عالية" value={report.vulnHigh} onChange={(v) => updateField('vulnHigh', parseInt(v) || 0)} type="number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="🟡 متوسطة" value={report.vulnMedium} onChange={(v) => updateField('vulnMedium', parseInt(v) || 0)} type="number" />
              <FormField label="🟢 منخفضة" value={report.vulnLow} onChange={(v) => updateField('vulnLow', parseInt(v) || 0)} type="number" />
            </div>
          </div>

          {/* Incident Status */}
          <div>
            <p className="text-sm font-[800] text-navy-950 mb-3">حالة الحوادث</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FormField label="🔴 مفتوحة" value={report.incOpen} onChange={(v) => updateField('incOpen', parseInt(v) || 0)} type="number" />
              <FormField label="🟠 قيد المعالجة" value={report.incProgress} onChange={(v) => updateField('incProgress', parseInt(v) || 0)} type="number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="🟢 مغلقة" value={report.incClosed} onChange={(v) => updateField('incClosed', parseInt(v) || 0)} type="number" />
              <FormField label="🔵 مراقبة" value={report.incWatch} onChange={(v) => updateField('incWatch', parseInt(v) || 0)} type="number" />
            </div>
          </div>
        </div>
      </FormCard>
    </div>
  );
}
