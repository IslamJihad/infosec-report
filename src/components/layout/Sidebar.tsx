'use client';

import { useReportStore } from '@/store/reportStore';
import { NAV_ITEMS } from '@/lib/constants';
import Link from 'next/link';

export default function Sidebar() {
  const { currentStep, setStep, report } = useReportStore();

  const progress = Math.round(((currentStep + 1) / 7) * 100);

  return (
    <aside className="w-[260px] bg-navy-950 text-white flex-shrink-0 fixed h-screen overflow-y-auto flex flex-col z-50">
      {/* Header */}
      <div className="p-5 pb-3.5 border-b border-white/[0.07]">
        <div className="text-2xl mb-1">🛡️</div>
        <h2 className="text-xs font-[900] leading-snug">تقرير أمن المعلومات</h2>
        <p className="text-[9px] opacity-35 mt-0.5">النسخة الاحترافية v5.0</p>
      </div>

      {/* Navigation */}
      <div className="p-3 pt-3 pb-1">
        <div className="text-[9px] opacity-30 tracking-[1.5px] uppercase pr-1.5 mb-1.5">أقسام الإدخال</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => setStep(item.key)}
            className={`flex items-center gap-2 w-full py-2 px-2.5 border-none rounded-[7px] cursor-pointer font-[Cairo] text-[11px] text-right transition-all duration-150 mb-0.5 ${
              currentStep === item.key
                ? 'bg-white/[0.12] text-white font-bold border-r-[3px] border-r-navy-600'
                : 'bg-transparent text-white/55 hover:bg-white/[0.07] hover:text-white'
            }`}
          >
            <span className="text-[13px] w-[17px] text-center flex-shrink-0">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Section toggles */}
      <div className="px-2.5 pt-2.5 pb-1 border-t border-white/[0.07] mt-1">
        <div className="text-[9px] opacity-30 tracking-[1.5px] uppercase pr-1.5 mb-1.5">إظهار / إخفاء</div>
        <ToggleRow
          label="⏱️ مقاييس SLA"
          checked={report?.showSLA ?? true}
          onChange={(v) => {
            const store = useReportStore.getState();
            store.updateField('showSLA', v);
          }}
        />
        <ToggleRow
          label="🧭 النضج الأمني"
          checked={report?.showMaturity ?? true}
          onChange={(v) => {
            const store = useReportStore.getState();
            store.updateField('showMaturity', v);
          }}
        />
      </div>

      {/* Progress */}
      <div className="px-3.5 pt-2.5 border-t border-white/[0.07] mt-auto">
        <p className="text-[9px] opacity-40 mb-1">الإتمام: {progress}%</p>
        <div className="bg-white/10 rounded-full h-[3px]">
          <div
            className="bg-gradient-to-l from-navy-600 to-navy-500 h-full rounded-full transition-all duration-400"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Links */}
      <div className="px-3.5 py-2 border-t border-white/[0.05] mt-3">
        <Link href="/" className="flex items-center gap-2 text-[10px] text-white/40 hover:text-white/70 transition-colors py-1">
          <span>📊</span> لوحة التقارير
        </Link>
        <Link href="/settings" className="flex items-center gap-2 text-[10px] text-white/40 hover:text-white/70 transition-colors py-1">
          <span>⚙️</span> الإعدادات
        </Link>
      </div>

      {/* Footer */}
      <div className="px-3.5 py-2 text-[9px] opacity-25 border-t border-white/[0.05]">
        © {new Date().getFullYear()} – إدارة أمن المعلومات
      </div>
    </aside>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-1.5 rounded-md mb-1">
      <span className="text-[10px] text-white/50">{label}</span>
      <label className="relative w-[30px] h-[16px] flex-shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="opacity-0 w-0 h-0 absolute"
        />
        <span className={`absolute inset-0 rounded-full transition-colors duration-250 ${checked ? 'bg-success-700' : 'bg-gray-600'}`} />
        <span
          className={`absolute top-[2px] w-[12px] h-[12px] bg-white rounded-full transition-all duration-250 pointer-events-none ${
            checked ? 'left-[2px] right-auto' : 'right-[2px] left-auto'
          }`}
        />
      </label>
    </div>
  );
}
