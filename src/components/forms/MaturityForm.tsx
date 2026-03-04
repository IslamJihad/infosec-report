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
        <div className="bg-navy-100 border border-blue-200 rounded-[7px] py-2 px-3 text-[10px] text-navy-800 mb-3">
          📐 قيّم كل مجال من 1 (مبتدئ) إلى 5 (محسّن). المتوسط الحالي: <strong>{avg} / 5</strong>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {report.maturityDomains.map((domain, i) => {
            const level = MATURITY_LEVELS[domain.score] || MATURITY_LEVELS[1];
            return (
              <div key={domain.id} className="bg-surface border border-border rounded-lg p-2.5">
                <label className="text-[10px] font-bold text-text-secondary block mb-1">{domain.name}</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={domain.score}
                    onChange={(e) => updateMaturity(i, parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className={`text-[10px] font-[800] px-2 py-0.5 rounded min-w-[85px] text-center ${level.colorClass}`}>
                    {domain.score}/5 – {level.label}
                  </span>
                </div>
                {/* Visual bar */}
                <div className="bg-gray-100 rounded-sm h-[6px] overflow-hidden mt-1.5">
                  <div
                    className={`h-full rounded-sm transition-all duration-300 ${level.barClass}`}
                    style={{ width: `${(domain.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Average summary */}
        <div className="mt-3 p-3 bg-navy-950 rounded-lg text-white text-center">
          <div className="text-[9px] opacity-50 mb-1">متوسط النضج الكلي</div>
          <div className="text-2xl font-[900]">{avg} <span className="text-sm opacity-50">/ 5</span></div>
          <div className="text-[10px] opacity-60 mt-1">
            {parseFloat(avg) >= 4 ? '🟢 متقدم' : parseFloat(avg) >= 3 ? '🟡 متوسط' : '🔴 يحتاج تحسيناً'}
          </div>
        </div>
      </FormCard>
    </div>
  );
}
