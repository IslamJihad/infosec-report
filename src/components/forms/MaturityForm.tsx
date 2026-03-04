'use client';

import { useReportStore } from '@/store/reportStore';
import { MATURITY_LEVELS } from '@/lib/constants';
import { FormCard } from './GeneralInfoForm';

export default function MaturityForm() {
  const { report, updateMaturity } = useReportStore();
  if (!report) return null;

  const avg = report.maturityDomains.length > 0
    ? (report.maturityDomains.reduce((a, m) => a + m.score, 0) / report.maturityDomains.length).toFixed(1)
    : '0';

  return (
    <div className="animate-fadeIn">
      <FormCard icon="🧭" title="مستوى النضج الأمني">
        <div className="bg-navy-100 border border-blue-200 rounded-xl py-3 px-4 text-sm text-navy-800 mb-4">
          📐 قيّم كل مجال من 1 (مبتدئ) إلى 5 (محسّن). المتوسط الحالي: <strong>{avg} / 5</strong>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {report.maturityDomains.map((domain, i) => {
            const level = MATURITY_LEVELS[domain.score] || MATURITY_LEVELS[1];
            return (
              <div key={domain.id} className="bg-surface border border-border/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <label className="text-sm font-bold text-text-secondary block mb-2">{domain.name}</label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={domain.score}
                    onChange={(e) => updateMaturity(i, parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className={`text-xs font-[800] px-3 py-1 rounded-lg min-w-[95px] text-center ${level.colorClass}`}>
                    {domain.score}/5 – {level.label}
                  </span>
                </div>
                {/* Visual bar */}
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden mt-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${level.barClass}`}
                    style={{ width: `${(domain.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Average summary */}
        <div className="mt-5 p-5 bg-gradient-to-l from-navy-950 to-[#0a1628] rounded-2xl text-white text-center shadow-lg">
          <div className="text-xs opacity-55 mb-2 font-semibold">متوسط النضج الكلي</div>
          <div className="text-4xl font-[900]">{avg} <span className="text-lg opacity-50">/ 5</span></div>
          <div className="text-sm opacity-65 mt-2">
            {parseFloat(avg) >= 4 ? '🟢 متقدم' : parseFloat(avg) >= 3 ? '🟡 متوسط' : '🔴 يحتاج تحسيناً'}
          </div>
        </div>
      </FormCard>
    </div>
  );
}
