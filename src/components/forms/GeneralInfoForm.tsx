'use client';

import { useReportStore } from '@/store/reportStore';
import { CLASSIFICATIONS } from '@/lib/constants';
import { useCallback } from 'react';

export default function GeneralInfoForm() {
  const { report, updateField } = useReportStore();
  if (!report) return null;

  return (
    <div className="animate-fadeIn">
      <FormCard icon="🏢" title="معلومات الشركة والتقرير">
        {/* Logo Upload */}
        <div className="mb-3">
          <label className="text-[10px] font-bold text-text-secondary block mb-1">شعار الشركة</label>
          <LogoUpload
            logoBase64={report.logoBase64}
            onChange={(v) => updateField('logoBase64', v)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <FormField label="اسم الشركة / المنظمة" value={report.orgName} onChange={(v) => updateField('orgName', v)} />
          <FormField label="المدير العام / المستلم" value={report.recipientName} onChange={(v) => updateField('recipientName', v)} />
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-2.5">
          <FormField label="الفترة الزمنية" value={report.period} onChange={(v) => updateField('period', v)} />
          <FormField label="تاريخ الإصدار" value={report.issueDate} onChange={(v) => updateField('issueDate', v)} type="date" />
          <FormField label="رقم الإصدار" value={report.version} onChange={(v) => updateField('version', v)} />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <FormField label="معد التقرير / القسم" value={report.author} onChange={(v) => updateField('author', v)} />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-secondary">تصنيف التقرير</label>
            <select
              value={report.classification}
              onChange={(e) => updateField('classification', e.target.value)}
              className="border-[1.5px] border-border rounded-[7px] py-[7px] px-2.5 font-[Cairo] text-[11px] text-text-primary outline-none transition-colors focus:border-navy-800 focus:shadow-[0_0_0_2px_rgba(26,58,124,0.08)] bg-white"
            >
              {CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </FormCard>
    </div>
  );
}

// Reusable form card
export function FormCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[10px] border border-border mb-3.5 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="bg-navy-50 py-2.5 px-4 border-b border-border flex items-center gap-2">
        <div className="bg-navy-800 text-white w-6 h-6 rounded-md flex items-center justify-center text-[11px] flex-shrink-0">
          {icon}
        </div>
        <h3 className="text-xs font-[800] text-navy-950 flex-1">{title}</h3>
      </div>
      <div className="p-3.5">{children}</div>
    </div>
  );
}

// Reusable form field
export function FormField({
  label,
  value,
  onChange,
  type = 'text',
  hint,
  readOnly,
  min,
  max,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
  readOnly?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-text-secondary">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        min={min}
        max={max}
        className={`border-[1.5px] border-border rounded-[7px] py-[7px] px-2.5 font-[Cairo] text-[11px] text-text-primary outline-none transition-colors focus:border-navy-800 focus:shadow-[0_0_0_2px_rgba(26,58,124,0.08)] bg-white ${
          readOnly ? 'bg-navy-50 font-bold cursor-default' : ''
        }`}
      />
      {hint && <span className="text-[9px] text-text-hint mt-0.5">{hint}</span>}
    </div>
  );
}

// Logo upload component
function LogoUpload({ logoBase64, onChange }: { logoBase64: string; onChange: (v: string) => void }) {
  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  return (
    <div>
      {!logoBase64 ? (
        <div
          onClick={() => document.getElementById('logo-input')?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-border rounded-[9px] p-3.5 text-center cursor-pointer bg-surface transition-colors hover:bg-navy-100 hover:border-navy-800"
        >
          <div className="text-xl mb-1">🖼️</div>
          <div className="text-[10px] text-text-hint">اضغط أو اسحب لرفع الشعار (PNG / JPG / SVG)</div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="border border-border rounded-lg p-2 bg-surface">
            <img src={logoBase64} alt="شعار" className="max-h-[50px] max-w-[140px] object-contain" />
          </div>
          <button
            onClick={() => onChange('')}
            className="bg-danger-100 text-danger-500 border-none rounded-md py-1 px-2.5 text-[10px] cursor-pointer font-[Cairo] hover:bg-red-200 transition-colors"
          >
            × حذف الشعار
          </button>
        </div>
      )}
      <input
        type="file"
        id="logo-input"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
