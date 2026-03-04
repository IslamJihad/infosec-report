'use client';

import type { ReportData } from '@/types/report';
import {
  formatArabicDate,
  getScoreColorClass,
  getDeltaInfo,
  SEVERITY_MAP,
  STATUS_MAP,
  PRIORITY_MAP,
  MATURITY_LEVELS,
  HEATMAP_COLORS,
  getHeatmapClass,
  getRiskScoreClass,
  PROBABILITY_LABELS,
  IMPACT_LABELS,
} from '@/lib/constants';

interface Props {
  report: ReportData;
}

export default function ReportPreview({ report }: Props) {
  const r = report;
  const dateF = formatArabicDate(r.issueDate);
  const scoreColor = getScoreColorClass(r.securityScore);
  const totalVuln = r.vulnCritical + r.vulnHigh + r.vulnMedium + r.vulnLow || 1;
  const avgMat = r.maturityDomains.length > 0
    ? (r.maturityDomains.reduce((a, m) => a + m.score, 0) / r.maturityDomains.length).toFixed(1)
    : '0';
  const sortedRisks = [...r.risks].sort((a, b) => b.probability * b.impact - a.probability * a.impact);

  let sectionNum = 0;
  function nextSection(icon: string, title: string) {
    sectionNum++;
    return (
      <div className="flex items-center gap-0 mb-4 border-b-2 border-navy-950 pb-2">
        <span className="bg-navy-950 text-white text-[10px] font-[800] py-0.5 px-2.5 tracking-wider">0{sectionNum}</span>
        <span className="text-[13px] font-[800] text-navy-950 py-0.5 px-3 flex-1">{title}</span>
        <span className="text-[13px] ml-1.5">{icon}</span>
      </div>
    );
  }

  // Heatmap grid
  const hmRows: Array<{ p: number; cells: Array<{ cls: string; cnt: number; score: number }> }> = [];
  for (let p = 5; p >= 1; p--) {
    const cells = [];
    for (let im = 1; im <= 5; im++) {
      const cnt = r.risks.filter((risk) => risk.probability === p && risk.impact === im).length;
      cells.push({ cls: getHeatmapClass(p * im), cnt, score: p * im });
    }
    hmRows.push({ p, cells });
  }

  return (
    <div className="report-page max-w-[900px] mx-auto bg-white shadow-[0_4px_32px_rgba(0,0,0,0.18)]">
      {/* ═══════ COVER PAGE ═══════ */}
      <div className="report-cover bg-navy-950 text-white min-h-[380px] flex flex-col relative overflow-hidden">
        {/* Accent strip */}
        <div className="absolute top-0 right-0 w-[6px] h-full bg-gradient-to-b from-navy-600 to-navy-700" />
        {/* Bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-navy-600 via-navy-700 to-navy-950" />
        {/* Watermark */}
        <div className="absolute bottom-8 left-8 text-[90px] font-[900] text-white/[0.03] tracking-[-4px] pointer-events-none select-none">
          SECURITY
        </div>

        {/* Top row */}
        <div className="flex items-start justify-between px-11 pt-8 relative z-10">
          <div>
            {r.logoBase64 ? (
              <img src={r.logoBase64} alt="شعار" className="max-h-[60px] max-w-[160px] object-contain brightness-110" />
            ) : (
              <div className="text-[10px] opacity-30 border border-white/15 px-3 py-1.5 rounded">{r.orgName}</div>
            )}
          </div>
          <div className="bg-red-500/15 border border-red-500/40 rounded px-3 py-1 text-[9px] font-[800] tracking-[2px] text-red-300 uppercase">
            🔒 {r.classification}
          </div>
        </div>

        {/* Body */}
        <div className="px-11 pt-9 relative z-10 flex-1">
          <div className="text-[9px] opacity-35 tracking-[3px] uppercase mb-2.5">Information Security Report</div>
          <div className="text-[32px] font-[900] leading-tight mb-1.5 tracking-[-0.5px]">
            تقرير<br />أمن المعلومات
          </div>
          <div className="w-12 h-[3px] bg-navy-600 my-3.5" />
          <div className="text-xs opacity-60 mb-1">
            مُقدَّم إلى: <strong className="opacity-100 text-white">{r.recipientName}</strong>
          </div>
          <div className="text-[11px] opacity-40">{r.orgName}</div>
        </div>

        {/* Bottom bar */}
        <div className="mt-auto border-t border-white/[0.08] px-11 py-4 flex justify-between items-center relative z-10 flex-wrap gap-2">
          <div className="flex gap-5 text-[10px] opacity-45 flex-wrap">
            <span>📅 {dateF}</span>
            <span>📋 {r.period}</span>
            <span>👤 {r.author}</span>
            <span>📄 الإصدار: v{r.version}</span>
            <span>📈 {r.securityLevel} – {r.trend}</span>
          </div>
          <div className="flex gap-px">
            {[
              ['درجة الأمن', `${r.securityScore}/100`],
              ['الامتثال', `${r.kpiCompliance}%`],
              ['المخاطر', `${r.kpiVuln}`],
              ['الحوادث', `${r.kpiTotal}`],
            ].map(([label, val]) => (
              <div key={label} className="bg-white/[0.06] px-3.5 py-2 text-center border-l border-white/[0.08] last:border-l-0">
                <div className="text-[8px] opacity-50 mb-0.5 tracking-wider">{label}</div>
                <div className="text-[15px] font-[900] text-navy-500">{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ SCORE BAR ═══════ */}
      <div className="bg-navy-50 border-b-2 border-border px-11 py-4 flex items-center gap-5">
        <div className={`w-[76px] h-[76px] rounded-full flex flex-col items-center justify-center font-[900] flex-shrink-0 border-[3px] ${scoreColor.ring} ${scoreColor.bg}`}>
          <div className={`text-[22px] leading-none ${scoreColor.text}`}>{r.securityScore}</div>
          <div className="text-[8px] opacity-60">/ 100</div>
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-[800] text-navy-950 mb-1.5">المستوى الأمني العام للمؤسسة: {r.securityLevel}</h3>
          <div className="flex gap-4 flex-wrap">
            {[
              ['حوادث حرجة', r.kpiCritical, '#c0392b'],
              ['ثغرات مكتشفة', r.kpiVuln, '#d35400'],
              ['إجمالي الحوادث', r.kpiTotal, '#1a3a7c'],
              ['نسبة الامتثال', `${r.kpiCompliance}%`, '#1b5e20'],
              ['متوسط النضج', `${avgMat}/5`, '#1a3a7c'],
              ['التزام SLA', `${r.slaRate}%`, '#1b5e20'],
            ].map(([label, val, color]) => (
              <div key={label as string} className="text-center px-2.5 py-1.5 bg-white border border-border rounded-md min-w-[60px]">
                <div className="text-[15px] font-[900]" style={{ color: color as string }}>{val}</div>
                <div className="text-[9px] text-text-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-3.5 py-2 bg-white border border-border rounded-[7px]">
          <div className="text-[22px]">{r.trend.includes('↑') || r.trend.includes('↗') ? '📈' : r.trend.includes('↘') ? '📉' : '➡️'}</div>
          <div className="text-[9px] text-text-muted whitespace-nowrap">{r.trend}</div>
        </div>
      </div>

      {/* ═══════ SECTION 01: EXECUTIVE SUMMARY ═══════ */}
      <div className="report-section px-11 py-6 border-b border-gray-100">
        {nextSection('📋', 'الملخص التنفيذي')}
        <div className="text-xs leading-[2.2] text-text-secondary p-3.5 bg-surface border-r-4 border-r-navy-950 rounded-l-md mb-3.5">
          {r.summary}
        </div>

        {r.decisions.length > 0 && (
          <div className="border border-border rounded-md overflow-hidden mt-1">
            <div className="bg-navy-950 text-white px-3.5 py-2 text-[11px] font-bold flex items-center gap-1.5">
              ⚠️ قرارات مطلوبة من الإدارة العليا
            </div>
            <div className="p-3.5">
              {r.decisions.map((dec, i) => (
                <div key={dec.id} className="flex gap-2.5 py-2 border-b border-gray-100 last:border-b-0 items-start">
                  <div className="bg-navy-800 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-[800] flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-[800] text-navy-950 mb-0.5">{dec.title}</div>
                    <div className="text-[10px] text-text-secondary leading-relaxed">{dec.description}</div>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {dec.budget && <span className="text-[9px] px-2 py-0.5 rounded bg-danger-100 text-danger-700 font-bold">💰 {dec.budget} ₪</span>}
                      {dec.department && <span className="text-[9px] px-2 py-0.5 rounded bg-navy-100 text-navy-800 font-bold">🏢 {dec.department}</span>}
                      {dec.timeline && <span className="text-[9px] px-2 py-0.5 rounded bg-success-100 text-success-700 font-bold">⏱️ {dec.timeline}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════ SECTION 02: KPIs ═══════ */}
      <div className="report-section px-11 py-6 border-b border-gray-100">
        {nextSection('📊', 'لوحة المؤشرات والأداء')}

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-px bg-border border border-border rounded-md overflow-hidden mb-3.5">
          {[
            { label: 'حوادث حرجة', val: r.kpiCritical, prev: r.prevCritical, color: 'text-danger-500', lower: true },
            { label: 'ثغرات مكتشفة', val: r.kpiVuln, prev: r.prevVuln, color: 'text-warning-500', lower: true },
            { label: 'إجمالي الحوادث', val: r.kpiTotal, prev: r.prevTotal, color: 'text-navy-800', lower: true },
            { label: 'نسبة الامتثال', val: r.kpiCompliance, prev: r.prevCompliance, color: 'text-success-700', lower: false, suffix: '%' },
          ].map((kpi) => {
            const info = getDeltaInfo(kpi.val, kpi.prev, kpi.lower);
            return (
              <div key={kpi.label} className="bg-white p-3.5 text-center">
                <div className={`text-[26px] font-[900] leading-none mb-1 ${kpi.color}`}>
                  {kpi.val}{kpi.suffix || ''}
                </div>
                <div className="text-[9px] font-bold text-text-secondary mb-1">{kpi.label}</div>
                <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-bold ${info.colorClass}`}>
                  {info.arrow} {info.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Two column charts */}
        <div className="grid grid-cols-2 gap-3.5 mb-3.5">
          {/* Vulnerability bars */}
          <div className="border border-border rounded-md overflow-hidden">
            <div className="bg-navy-800 text-white px-3 py-1.5 text-[10px] font-bold">توزيع الثغرات حسب الخطورة</div>
            <div className="p-3">
              {[
                { label: 'حرجة', val: r.vulnCritical, color: 'bg-danger-500' },
                { label: 'عالية', val: r.vulnHigh, color: 'bg-warning-500' },
                { label: 'متوسطة', val: r.vulnMedium, color: 'bg-yellow-500' },
                { label: 'منخفضة', val: r.vulnLow, color: 'bg-success-700' },
              ].map((item) => (
                <div key={item.label} className="mb-2">
                  <div className="flex justify-between text-[10px] text-text-secondary mb-0.5">
                    <span>{item.label}</span>
                    <span>{item.val} ({Math.round((item.val / totalVuln) * 100)}%)</span>
                  </div>
                  <div className="bg-gray-100 rounded-sm h-2 overflow-hidden">
                    <div className={`h-full rounded-sm ${item.color}`} style={{ width: `${Math.round((item.val / totalVuln) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incident status */}
          <div className="border border-border rounded-md overflow-hidden">
            <div className="bg-navy-800 text-white px-3 py-1.5 text-[10px] font-bold">حالة الحوادث الأمنية</div>
            <div className="p-3">
              <table className="w-full">
                <tbody>
                  {[
                    { label: 'مفتوحة / غير معالجة', val: r.incOpen, dot: 'bg-danger-500' },
                    { label: 'قيد المعالجة', val: r.incProgress, dot: 'bg-warning-500' },
                    { label: 'مغلقة / تم الحل', val: r.incClosed, dot: 'bg-success-700' },
                    { label: 'تحت المراقبة', val: r.incWatch, dot: 'bg-navy-800' },
                  ].map((item) => (
                    <tr key={item.label}>
                      <td className="py-1.5 px-2 text-[10px] border-b border-gray-100">
                        <span className={`inline-block w-2 h-2 rounded-full ml-1.5 ${item.dot}`} />
                        {item.label}
                      </td>
                      <td className="py-1.5 px-2 text-[10px] font-[800] text-navy-950 border-b border-gray-100 text-left">{item.val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Trend table */}
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              {['المؤشر', 'الفترة السابقة', 'الفترة الحالية', 'التغيير'].map((h) => (
                <th key={h} className="bg-navy-950 text-white py-1.5 px-2.5 text-right font-bold text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'الحوادث الحرجة', prev: r.prevCritical, cur: r.kpiCritical, lower: true },
              { label: 'الثغرات المكتشفة', prev: r.prevVuln, cur: r.kpiVuln, lower: true },
              { label: 'إجمالي الحوادث', prev: r.prevTotal, cur: r.kpiTotal, lower: true },
              { label: 'نسبة الامتثال (%)', prev: r.prevCompliance, cur: r.kpiCompliance, lower: false },
            ].map((row, i) => {
              const info = getDeltaInfo(row.cur, row.prev, row.lower);
              return (
                <tr key={row.label} className={i % 2 === 1 ? 'bg-surface' : ''}>
                  <td className="py-1.5 px-2.5 border-b border-gray-100">{row.label}</td>
                  <td className="py-1.5 px-2.5 border-b border-gray-100">{row.prev}</td>
                  <td className="py-1.5 px-2.5 border-b border-gray-100 font-bold">{row.cur}</td>
                  <td className="py-1.5 px-2.5 border-b border-gray-100">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${info.colorClass}`}>
                      {info.arrow} {info.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══════ SECTION 03: SLA ═══════ */}
      {r.showSLA && (
        <div className="report-section px-11 py-6 border-b border-gray-100">
          {nextSection('⏱️', 'مقاييس الاستجابة للحوادث (SLA)')}

          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { code: 'MTTD', label: 'وقت الاكتشاف', val: r.slaMTTD, target: r.slaMTTDTarget },
              { code: 'MTTR', label: 'وقت الاستجابة', val: r.slaMTTR, target: r.slaMTTRTarget },
              { code: 'MTTC', label: 'وقت الاحتواء', val: r.slaMTTC, target: r.slaMTTCTarget },
            ].map((sla) => {
              const ok = sla.val <= sla.target;
              const pct = sla.target > 0 ? Math.min(100, Math.round((sla.val / sla.target) * 100)) : 0;
              return (
                <div key={sla.code} className="border border-border rounded-md overflow-hidden">
                  <div className={`py-1.5 px-2.5 text-[9px] font-bold text-center tracking-wider ${ok ? 'bg-success-100 text-success-700 border-b-2 border-b-success-700' : 'bg-danger-100 text-danger-500 border-b-2 border-b-danger-500'}`}>
                    {ok ? '✅ ضمن الهدف' : '⚠️ تجاوز الهدف'} – {sla.code}
                  </div>
                  <div className="p-2.5 text-center">
                    <div className={`text-xl font-[900] ${ok ? 'text-success-700' : 'text-danger-500'}`}>{sla.val}</div>
                    <div className="text-[9px] text-text-muted">ساعة</div>
                    <div className="text-[9px] text-text-muted mt-0.5">{sla.label} | الهدف: ≤ {sla.target} ساعة</div>
                    <div className="bg-gray-100 rounded-sm h-[5px] overflow-hidden mt-1.5">
                      <div className={`h-full rounded-sm ${ok ? 'bg-success-700' : 'bg-danger-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-border rounded-md p-2.5 text-center">
              <div className={`text-lg font-[900] ${r.slaRate >= 80 ? 'text-success-700' : 'text-danger-500'}`}>{r.slaRate}%</div>
              <div className="text-[9px] text-text-muted">نسبة الحوادث المحلولة ضمن SLA</div>
            </div>
            <div className="border border-border rounded-md p-2.5 text-center">
              <div className={`text-lg font-[900] ${r.slaBreach === 0 ? 'text-success-700' : 'text-danger-500'}`}>{r.slaBreach}</div>
              <div className="text-[9px] text-text-muted">حوادث تجاوزت حدود SLA</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ SECTION 04: TOP RISKS ═══════ */}
      <div className="report-section px-11 py-6 border-b border-gray-100">
        {nextSection('⚠️', 'أبرز المخاطر والثغرات')}

        <table className="w-full border-collapse text-[11px] mb-3.5">
          <thead>
            <tr>
              {['#', 'وصف الخطر / الثغرة', 'النظام المتأثر', 'الخطورة', 'الحالة', 'احتمالية', 'تأثير', 'درجة'].map((h) => (
                <th key={h} className="bg-navy-950 text-white py-2 px-2.5 text-right font-bold text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRisks.map((risk, i) => {
              const score = risk.probability * risk.impact;
              const sev = SEVERITY_MAP[risk.severity];
              const st = STATUS_MAP[risk.status];
              return (
                <tr key={risk.id} className={`${i % 2 === 1 ? 'bg-surface' : ''} hover:bg-navy-50 transition-colors`}>
                  <td className="py-2 px-2.5 border-b border-gray-100 text-center font-[800] text-text-secondary text-[11px]">{i + 1}</td>
                  <td className="py-2 px-2.5 border-b border-gray-100 font-semibold">{risk.description}</td>
                  <td className="py-2 px-2.5 border-b border-gray-100 text-text-secondary">{risk.system}</td>
                  <td className="py-2 px-2.5 border-b border-gray-100">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${sev?.bgClass}`}>{sev?.label}</span>
                  </td>
                  <td className="py-2 px-2.5 border-b border-gray-100">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${st?.bgClass}`}>{st?.label}</span>
                  </td>
                  <td className="py-2 px-2.5 border-b border-gray-100 text-center">{risk.probability}</td>
                  <td className="py-2 px-2.5 border-b border-gray-100 text-center">{risk.impact}</td>
                  <td className="py-2 px-2.5 border-b border-gray-100 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-[900] ${getRiskScoreClass(score)}`}>
                      {score}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Heatmap */}
        <div className="overflow-x-auto mt-3.5">
          <div className="text-[10px] font-bold text-navy-950 mb-2">خريطة المخاطر الحرارية (Risk Heat Map)</div>
          <table className="border-collapse w-full text-[9px]">
            <thead>
              <tr>
                <th className="bg-navy-800 text-white py-1.5 px-2 text-center font-bold">الاحتمالية / التأثير</th>
                {IMPACT_LABELS.slice(1).map((label, i) => (
                  <th key={i} className="bg-navy-800 text-white py-1.5 px-2 text-center font-bold">{i + 1} – {label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hmRows.map((row) => (
                <tr key={row.p}>
                  <td className="bg-navy-50 text-navy-800 font-bold text-right py-1.5 px-2.5 whitespace-nowrap">
                    {PROBABILITY_LABELS[row.p]} ({row.p})
                  </td>
                  {row.cells.map((cell, ci) => {
                    const colors = HEATMAP_COLORS[cell.cls];
                    return (
                      <td key={ci} className="p-1">
                        <div
                          className="rounded h-7 flex items-center justify-center font-[800] text-[9px] gap-0.5"
                          style={{ background: colors?.bg, color: colors?.text }}
                        >
                          {cell.cnt > 0 && <span>{cell.cnt}▪</span>}
                          <span>{cell.score}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-2.5 mt-2 flex-wrap">
            {[
              ['hm1', 'منخفض (≤4)'],
              ['hm2', 'متوسط (5-9)'],
              ['hm3', 'عالٍ (10-16)'],
              ['hm4', 'حرج (17-20)'],
              ['hm5', 'كارثي (25)'],
            ].map(([cls, label]) => {
              const colors = HEATMAP_COLORS[cls];
              return (
                <div key={cls} className="flex items-center gap-1 text-[9px] text-text-secondary">
                  <div className="w-3 h-3 rounded-sm" style={{ background: colors?.bg }} />
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════ SECTION 05: MATURITY ═══════ */}
      {r.showMaturity && (
        <div className="report-section px-11 py-6 border-b border-gray-100">
          {nextSection('🧭', 'مستوى النضج الأمني للمؤسسة')}
          <div className="text-[11px] text-text-secondary mb-3">
            متوسط النضج الكلي: <strong className="text-navy-950">{avgMat} / 5</strong> – {parseFloat(avgMat) >= 4 ? 'متقدم' : parseFloat(avgMat) >= 3 ? 'متوسط' : 'يحتاج تحسيناً'}
          </div>
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                {['المجال الأمني', 'مستوى النضج', 'التقييم', 'التصنيف'].map((h) => (
                  <th key={h} className="bg-navy-950 text-white py-1.5 px-2.5 text-right font-bold text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.maturityDomains.map((domain, i) => {
                const level = MATURITY_LEVELS[domain.score] || MATURITY_LEVELS[1];
                return (
                  <tr key={domain.id} className={i % 2 === 1 ? 'bg-surface' : ''}>
                    <td className="py-2 px-2.5 border-b border-gray-100 font-semibold">{domain.name}</td>
                    <td className="py-2 px-2.5 border-b border-gray-100">
                      <div className="w-[120px]">
                        <div className="bg-gray-100 rounded-sm h-[7px] overflow-hidden">
                          <div className={`h-full rounded-sm ${level.barClass}`} style={{ width: `${(domain.score / 5) * 100}%` }} />
                        </div>
                        <div className="text-[10px] font-bold text-navy-950 mt-0.5">{domain.score} / 5</div>
                      </div>
                    </td>
                    <td className="py-2 px-2.5 border-b border-gray-100">{level.label}</td>
                    <td className="py-2 px-2.5 border-b border-gray-100">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${level.colorClass}`}>{level.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════ SECTION 06: RECOMMENDATIONS ═══════ */}
      <div className="report-section px-11 py-6 border-b border-gray-100">
        {nextSection('✅', 'التوصيات وخارطة طريق العلاج')}
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              {['#', 'التوصية', 'الأولوية', 'الجهة', 'الجدول الزمني'].map((h) => (
                <th key={h} className="bg-navy-950 text-white py-1.5 px-2.5 text-right font-bold text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.recommendations.map((rec, i) => {
              const pri = PRIORITY_MAP[rec.priority];
              return (
                <tr key={rec.id} className={`${i % 2 === 1 ? 'bg-surface' : ''} hover:bg-navy-50 transition-colors`}>
                  <td className="py-2 px-2.5 border-b border-gray-100 text-center font-[800] text-text-secondary">{i + 1}</td>
                  <td className="py-2 px-2.5 border-b border-gray-100">
                    <div className="font-bold text-navy-950 mb-0.5">{rec.title}</div>
                    <div className="text-[10px] text-text-secondary">{rec.description}</div>
                  </td>
                  <td className="py-2 px-2.5 border-b border-gray-100">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${pri?.bgClass}`}>{pri?.label}</span>
                  </td>
                  <td className="py-2 px-2.5 border-b border-gray-100">
                    {rec.department ? <span className="bg-navy-50 text-navy-950 text-[9px] px-1.5 py-0.5 rounded font-semibold border border-border">{rec.department}</span> : '-'}
                  </td>
                  <td className="py-2 px-2.5 border-b border-gray-100">
                    {rec.timeline ? <span className="bg-gray-100 text-navy-800 text-[9px] px-1.5 py-0.5 rounded font-bold">⏱️ {rec.timeline}</span> : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══════ FOOTER ═══════ */}
      <div className="bg-navy-950 text-white/50 flex justify-between items-center px-11 py-2.5 text-[9px] flex-wrap gap-1.5">
        <span><strong className="text-white">{r.classification}</strong> – للمستلم المحدد فقط</span>
        <span>{r.orgName} &nbsp;|&nbsp; {r.author}</span>
        <span>{dateF} &nbsp;|&nbsp; الإصدار v{r.version}</span>
      </div>
    </div>
  );
}
