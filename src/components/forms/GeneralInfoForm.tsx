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
        <div className="mb-4">
          <label className="text-sm font-bold text-text-secondary block mb-2">شعار الشركة</label>
          <LogoUpload
            logoBase64={report.logoBase64}
            onChange={(v) => updateField('logoBase64', v)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <FormField label="اسم الشركة / المنظمة" value={report.orgName} onChange={(v) => updateField('orgName', v)} />
          <FormField label="المدير العام / المستلم" value={report.recipientName} onChange={(v) => updateField('recipientName', v)} />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <FormField label="الفترة الزمنية" value={report.period} onChange={(v) => updateField('period', v)} />
          <FormField label="تاريخ الإصدار" value={report.issueDate} onChange={(v) => updateField('issueDate', v)} type="date" />
          <FormField label="رقم الإصدار" value={report.version} onChange={(v) => updateField('version', v)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="معد التقرير / القسم" value={report.author} onChange={(v) => updateField('author', v)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-text-secondary">تصنيف التقرير</label>
            <select
              value={report.classification}
              onChange={(e) => updateField('classification', e.target.value)}
              className="border-[1.5px] border-border rounded-xl py-2.5 px-3.5 text-sm text-text-primary outline-none transition-all duration-200 focus:border-navy-700 focus:shadow-[0_0_0_3px_rgba(26,58,124,0.1)] bg-white hover:border-navy-200"
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
    <div className="bg-white rounded-2xl border border-border/60 mb-5 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="bg-gradient-to-l from-navy-50 to-white py-4 px-5 border-b border-border flex items-center gap-3">
        <div className="bg-gradient-to-br from-navy-800 to-navy-900 text-white w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 shadow-sm">
          {icon}
        </div>
        <h3 className="text-base font-[800] text-navy-950 flex-1">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
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
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-text-secondary">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        min={min}
        max={max}
        className={`border-[1.5px] border-border rounded-xl py-2.5 px-3.5 text-sm text-text-primary outline-none transition-all duration-200 focus:border-navy-700 focus:shadow-[0_0_0_3px_rgba(26,58,124,0.1)] focus:ring-0 bg-white hover:border-navy-200 ${
          readOnly ? 'bg-navy-50 font-bold cursor-default' : ''
        }`}
      />
      {hint && <span className="text-xs text-text-hint mt-1">{hint}</span>}
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
          className="border-2 border-dashed border-border rounded-2xl p-5 text-center cursor-pointer bg-surface transition-all duration-200 hover:bg-navy-100 hover:border-navy-600 hover:shadow-sm"
        >
          <div className="text-3xl mb-2">🖼️</div>
          <div className="text-sm text-text-muted">اضغط أو اسحب لرفع الشعار (PNG / JPG / SVG)</div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="border border-border rounded-xl p-3 bg-surface">
            <img src={logoBase64} alt="شعار" className="max-h-[60px] max-w-[160px] object-contain" />
          </div>
          <button
            onClick={() => onChange('')}
            className="bg-danger-100 text-danger-500 border border-red-200 rounded-xl py-2 px-4 text-sm cursor-pointer hover:bg-red-200 transition-all duration-200"
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
