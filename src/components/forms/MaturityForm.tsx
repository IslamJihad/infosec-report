'use client';

import { useReportStore } from '@/store/reportStore';
import { FormCard } from './GeneralInfoForm';

function getComplianceTone(score: number) {
  if (score >= 85) return { badge: 'bg-success-100 text-success-700', bar: 'bg-success-700' };
  if (score >= 70) return { badge: 'bg-green-100 text-green-700', bar: 'bg-green-600' };
  if (score >= 50) return { badge: 'bg-warning-100 text-warning-700', bar: 'bg-warning-500' };
  return { badge: 'bg-danger-100 text-danger-500', bar: 'bg-danger-500' };
}

function getAvgComplianceLabel(avgNum: number) {
  if (avgNum >= 85) return '🟢 امتثال ممتاز';
  if (avgNum >= 70) return '🟩 امتثال جيد';
  if (avgNum >= 50) return '🟨 امتثال متوسط';
  return '🟥 يحتاج تحسيناً';
}

export default function MaturityForm() {
  const { report, updateMaturity, addMaturity, removeMaturity } = useReportStore();
  if (!report) return null;

  const avg = report.maturityDomains.length > 0
    ? (report.maturityDomains.reduce((a, m) => a + m.score, 0) / report.maturityDomains.length).toFixed(1)
    : '0.0';

  const avgNum = Number.parseFloat(avg);
  const avgLabel = getAvgComplianceLabel(avgNum);

  return (
    <div className="animate-fadeIn">
      <FormCard icon="🧭" title="مستوى النضج الأمني">
        <div className="bg-navy-100 border border-blue-200 rounded-xl py-3 px-4 text-sm text-navy-800 mb-4">
          📐 أدخل اسم كل بند ونسبة الامتثال له من 100. يمكنك إضافة أو حذف البنود بحرية.
        </div>

        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="bg-linear-to-l from-navy-950 to-[#0a1628] rounded-2xl px-5 py-3 text-white shadow-lg min-w-55">
            <div className="text-xs opacity-60 mb-1 font-semibold">{"متوسط الامتثال الكلي\n"}</div>
            <div className="text-3xl font-black leading-none">{avg}%</div>
            <div className="text-xs opacity-80 mt-1.5">{avgLabel}</div>
          </div>

          <button
            type="button"
            onClick={addMaturity}
            className="bg-linear-to-l from-navy-800 to-navy-900 text-white border-none rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer hover:from-navy-700 hover:to-navy-800 transition-all duration-200 shadow-sm"
          >
            + إضافة بند جديد
          </button>
        </div>

        <div className="border border-border/70 rounded-2xl overflow-hidden bg-white">
          <div className="grid grid-cols-[70px_1.4fr_180px_1fr_90px] gap-3 py-3 px-4 bg-surface border-b border-border text-xs font-bold text-text-muted">
            <div className="text-center">#</div>
            <div>اسم البند</div>
            <div className="text-center">نسبة الامتثال</div>
            <div>مؤشر بصري</div>
            <div className="text-center">حذف</div>
          </div>

          {report.maturityDomains.map((domain, i) => {
            const tone = getComplianceTone(domain.score);
            return (
              <div key={domain.id} className="grid grid-cols-[70px_1.4fr_180px_1fr_90px] gap-3 py-3 px-4 border-b border-border/60 last:border-b-0 items-center">
                <div className="text-center text-xs font-bold text-text-hint">{i + 1}</div>

                <input
                  type="text"
                  value={domain.name}
                  onChange={(e) => updateMaturity(i, { name: e.target.value })}
                  placeholder="اكتب اسم البند"
                  className="border-[1.5px] border-border rounded-xl py-2.5 px-3 text-sm text-text-primary outline-none transition-all duration-200 focus:border-navy-700 focus:shadow-[0_0_0_3px_rgba(26,58,124,0.1)] bg-white"
                />

                <div className="flex items-center gap-2 justify-center">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={domain.score}
                    onChange={(e) => updateMaturity(i, { score: Number.parseInt(e.target.value, 10) || 0 })}
                    className="w-22.5 border-[1.5px] border-border rounded-xl py-2 px-2.5 text-sm text-center outline-none focus:border-navy-700 focus:shadow-[0_0_0_3px_rgba(26,58,124,0.1)]"
                  />
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg min-w-14 text-center ${tone.badge}`}>
                    {domain.score}%
                  </span>
                </div>

                <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${tone.bar}`}
                    style={{ width: `${domain.score}%` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeMaturity(i)}
                  className="bg-danger-100 text-danger-500 border border-red-200 rounded-lg py-2 text-xs font-bold hover:bg-red-200 transition-colors"
                  title="حذف البند"
                >
                  حذف
                </button>
              </div>
            );
          })}
        </div>
      </FormCard>
    </div>
  );
}
