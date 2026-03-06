'use client';

import { useReportStore } from '@/store/reportStore';
import { NAV_ITEMS } from '@/lib/constants';
import Link from 'next/link';

export default function Sidebar() {
  const { currentStep, setStep, report } = useReportStore();

  const progress = Math.round(((currentStep + 1) / 10) * 100);

  return (
    <aside className="w-[280px] bg-gradient-to-b from-navy-950 via-navy-950 to-[#060e1f] text-white flex-shrink-0 fixed h-screen overflow-y-auto flex flex-col z-50 shadow-2xl">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-white/[0.07]">
        <div className="w-10 h-10 bg-gradient-to-br from-navy-600 to-navy-800 rounded-xl flex items-center justify-center text-xl mb-2.5 shadow-lg">🛡️</div>
        <h2 className="text-sm font-[900] leading-snug">تقرير أمن المعلومات</h2>
        <p className="text-xs opacity-40 mt-1">النسخة الاحترافية v5.0</p>
      </div>

      {/* Navigation */}
      <div className="p-4 pt-4 pb-2">
        <div className="text-[11px] opacity-35 tracking-[1.5px] uppercase pr-2 mb-2.5 font-bold">أقسام الإدخال</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => setStep(item.key)}
            className={`flex items-center gap-3 w-full py-2.5 px-3 border-none rounded-xl cursor-pointer text-sm text-right transition-all duration-200 mb-1 ${
              currentStep === item.key
                ? 'bg-white/[0.12] text-white font-bold border-r-[3px] border-r-navy-600 shadow-sm'
                : 'bg-transparent text-white/55 hover:bg-white/[0.07] hover:text-white'
            }`}
          >
            <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Section toggles */}
      <div className="px-4 pt-4 pb-2 border-t border-white/[0.07] mt-2">
        <div className="text-[11px] opacity-35 tracking-[1.5px] uppercase pr-2 mb-2.5 font-bold">إظهار / إخفاء</div>
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
      <div className="px-5 pt-4 border-t border-white/[0.07] mt-auto">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs opacity-50 font-semibold">الإتمام</p>
          <p className="text-xs opacity-70 font-bold">{progress}%</p>
        </div>
        <div className="bg-white/10 rounded-full h-1.5">
          <div
            className="bg-gradient-to-l from-navy-600 to-navy-500 h-full rounded-full transition-all duration-400"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Links */}
      <div className="px-5 py-3 border-t border-white/[0.05] mt-4">
        <Link href="/" className="flex items-center gap-2.5 text-xs text-white/45 hover:text-white/80 transition-colors py-1.5 no-underline">
          <span>📊</span> لوحة التقارير
        </Link>
        <Link href="/settings" className="flex items-center gap-2.5 text-xs text-white/45 hover:text-white/80 transition-colors py-1.5 no-underline">
          <span>⚙️</span> الإعدادات
        </Link>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 text-[11px] opacity-30 border-t border-white/[0.05]">
        © {new Date().getFullYear()} – إدارة أمن المعلومات
      </div>
    </aside>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2 px-2 rounded-lg mb-1 hover:bg-white/5 transition-colors">
      <span className="text-xs text-white/55">{label}</span>
      <label className="relative w-9 h-5 flex-shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="opacity-0 w-0 h-0 absolute"
        />
        <span className={`absolute inset-0 rounded-full transition-colors duration-250 ${checked ? 'bg-success-700' : 'bg-gray-600'}`} />
        <span
          className={`absolute top-[3px] w-[14px] h-[14px] bg-white rounded-full transition-all duration-250 pointer-events-none shadow-sm ${
            checked ? 'left-[3px] right-auto' : 'right-[3px] left-auto'
          }`}
        />
      </label>
    </div>
  );
}
