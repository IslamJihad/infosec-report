'use client';

import { useReportStore } from '@/store/reportStore';
import { FormCard, FormField } from './GeneralInfoForm';

export default function AssetProtectionForm() {
  const { report, addAsset, updateAsset, removeAsset } = useReportStore();
  if (!report) return null;

  return (
    <div id="search-editor-section-assets" className="animate-fadeIn">
      <FormCard icon="🏛️" title="حماية الأصول الحيوية">
        <div className="bg-navy-100 border border-blue-200 rounded-xl py-3 px-4 text-sm text-navy-800 mb-4">
          🎯 الأصل الحيوي = أي شيء لو اختُرق أو توقف سيضر بالعمل مباشرة. أدخل مستوى الحماية الحقيقي لا المأمول.
        </div>

        {report.assets.map((asset, i) => (
          <div id={`search-editor-asset-${asset.id}`} key={asset.id} className="bg-surface border border-border/60 rounded-2xl p-5 mb-3 relative animate-fadeIn shadow-sm hover:shadow-md transition-all duration-200">
            <button
              onClick={() => removeAsset(i)}
              className="absolute top-3 left-3 bg-danger-100 text-danger-500 border border-red-200 rounded-xl w-7 h-7 cursor-pointer text-sm flex items-center justify-center hover:bg-red-200 transition-all duration-200"
            >
              ×
            </button>
            <div className="pr-0 pl-10">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <FormField label="اسم الأصل" value={asset.name} onChange={(v) => updateAsset(i, { name: v })} />
                <FormField label="أهمية الأصل / القيمة" value={asset.value} onChange={(v) => updateAsset(i, { value: v })} />
              </div>

              {/* Protection Level Slider */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-text-secondary">مستوى الحماية</label>
                  <span className={`text-sm font-[900] px-3 py-1 rounded-lg ${getProtectionColor(asset.protectionLevel)}`}>
                    {asset.protectionLevel}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={asset.protectionLevel}
                  onChange={(e) => updateAsset(i, { protectionLevel: parseInt(e.target.value) })}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-navy-700"
                  style={{
                    background: `linear-gradient(to left, ${asset.protectionLevel >= 70 ? '#16a34a' : asset.protectionLevel >= 40 ? '#d97706' : '#dc2626'} ${asset.protectionLevel}%, #e5e7eb ${asset.protectionLevel}%)`,
                  }}
                />
                <div className="flex justify-between text-[10px] text-text-hint mt-1">
                  <span>0% — غير محمي</span>
                  <span>100% — محمي بالكامل</span>
                </div>
              </div>

              <FormField
                label="الفجوات / نقاط الضعف"
                value={asset.gaps}
                onChange={(v) => updateAsset(i, { gaps: v })}
                hint="ما الذي ينقص هذا الأصل ليكون محمياً بالكامل؟"
              />
            </div>
          </div>
        ))}

        <button
          onClick={addAsset}
          className="flex items-center gap-2 bg-navy-50 text-navy-800 border-2 border-dashed border-navy-200 rounded-2xl py-3 px-4 cursor-pointer text-sm font-bold w-full justify-center transition-all duration-200 hover:bg-navy-100 hover:border-navy-600 hover:shadow-sm"
        >
          + إضافة أصل حيوي
        </button>
      </FormCard>
    </div>
  );
}

function getProtectionColor(level: number): string {
  if (level >= 70) return 'bg-success-100 text-success-700';
  if (level >= 40) return 'bg-warning-100 text-warning-700';
  return 'bg-danger-100 text-danger-500';
}
