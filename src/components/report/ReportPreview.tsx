'use client';

import { useRef, useEffect } from 'react';
import type { ReportData } from '@/types/report';
import {
  formatArabicDate,
  getDeltaInfo,
  SEVERITY_MAP,
  STATUS_MAP,
  PRIORITY_MAP,
  CHALLENGE_TYPES,
} from '@/lib/constants';
import { calculateGlobalSecurityScore, getPercentileText } from '@/lib/scoring';

interface Props {
  report: ReportData;
}

function drawKpiComboChart(canvas: HTMLCanvasElement, r: ReportData) {
  const DPR = 2;
  const W = canvas.offsetWidth || 680;
  const H = 200;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(DPR, DPR);

  const labels = ['حوادث حرجة', 'ثغرات مكتشفة', 'إجمالي الحوادث', 'امتثال ISO%'];
  const cur = [r.kpiCritical, r.kpiVuln, r.kpiTotal, r.kpiCompliance];
  const prev = [r.prevCritical, r.prevVuln, r.prevTotal, r.prevCompliance];
  const curColors = ['#dc2626', '#d97706', '#1e3a5f', '#16a34a'];

  const PAD = { top: 28, right: 20, bottom: 52, left: 36 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const N = labels.length;
  const grpW = cW / N;
  const barW = Math.min(28, Math.floor((grpW - 14) / 2));
  const maxVal = Math.max(...cur, ...prev, 1);

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  for (let v = 0; v <= 4; v++) {
    const y = PAD.top + cH * (1 - v / 4);
    ctx.strokeStyle = v === 0 ? '#cbd5e1' : '#f1f5f9';
    ctx.lineWidth = v === 0 ? 1 : 0.5;
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + cW, y); ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(String(Math.round(maxVal * v / 4)), PAD.left - 4, y + 3);
  }

  labels.forEach((lbl, gi) => {
    const gx = PAD.left + gi * grpW;
    const cx = gx + grpW / 2;
    const sx = cx - barW - 2;

    // prev bar
    const pHgt = Math.max(2, (prev[gi] / maxVal) * cH);
    const pY = PAD.top + cH - pHgt;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(sx, pY, barW, pHgt);
    ctx.fillStyle = '#94a3b8'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(String(prev[gi]), sx + barW / 2, pY - 3);

    // current bar
    const cHgt = Math.max(2, (cur[gi] / maxVal) * cH);
    const cY = PAD.top + cH - cHgt;
    ctx.fillStyle = curColors[gi];
    ctx.fillRect(sx + barW + 4, cY, barW, cHgt);
    ctx.fillStyle = curColors[gi]; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(String(cur[gi]), sx + barW + 4 + barW / 2, cY - 3);

    ctx.fillStyle = '#334155'; ctx.font = 'bold 8.5px sans-serif'; ctx.textAlign = 'center';
    const words = lbl.split(' ');
    ctx.fillText(words.slice(0, Math.ceil(words.length / 2)).join(' '), cx, H - PAD.bottom + 14);
    if (words.length > 2) ctx.fillText(words.slice(Math.ceil(words.length / 2)).join(' '), cx, H - PAD.bottom + 25);
    else if (words.length === 2 && lbl.length > 6) ctx.fillText(words[1], cx, H - PAD.bottom + 25);
  });
}

export default function ReportPreview({ report }: Props) {
  const r = report;
  const dateF = formatArabicDate(r.issueDate);
  const kpiChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = kpiChartRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => { if (kpiChartRef.current) drawKpiComboChart(kpiChartRef.current, r); });
    obs.observe(el);
    drawKpiComboChart(el, r);
    return () => obs.disconnect();
  }, [r]);

  const totalVuln = r.vulnCritical + r.vulnHigh + r.vulnMedium + r.vulnLow || 1;
  const sortedRisks = [...r.risks].sort((a, b) => b.probability * b.impact - a.probability * a.impact);
  const critRisks = sortedRisks.filter(risk => risk.probability * risk.impact >= 15).length;
  const avgProt = r.assets.length ? Math.round(r.assets.reduce((s, a) => s + a.protectionLevel, 0) / r.assets.length) : 70;
  const avgMat = r.maturityDomains.length > 0
    ? (r.maturityDomains.reduce((a, m) => a + m.score, 0) / r.maturityDomains.length).toFixed(1)
    : '0';
  const trendUp = r.trend.includes('↑') || r.trend.includes('↗');
  const trendDown = r.trend.includes('↓') || r.trend.includes('↘');
  const effKPIs = r.efficiencyKPIs ?? [];
  const scoreResult = r.scoreBreakdown
    ? { securityScore: r.securityScore, scoreBreakdown: r.scoreBreakdown }
    : calculateGlobalSecurityScore(r);
  const finalScore = scoreResult.securityScore;
  const scoreBreakdown = scoreResult.scoreBreakdown;
  const { componentScores, weightedContributions, riskPostureDetails, operationalDetails } = scoreBreakdown;

  const scoreColor = (s: number) => s >= 75 ? '#16a34a' : s >= 50 ? '#d97706' : '#dc2626';
  const ragColor = (rag: string) => rag === 'r' ? '#dc2626' : rag === 'a' ? '#f59e0b' : rag === 'g' ? '#22c55e' : '#94a3b8';
  const ragLabel = (rag: string) => rag === 'r' ? 'يستوجب تدخلاً' : rag === 'a' ? 'يستوجب متابعة' : rag === 'g' ? 'وضع جيد' : '';
  const ragBg   = (rag: string) => rag === 'r' ? '#fef2f2' : rag === 'a' ? '#fffbeb' : rag === 'g' ? '#f0fdf4' : '#f8fafc';
  const ragBorder = (rag: string) => rag === 'r' ? 'rgba(220,38,38,.15)' : rag === 'a' ? 'rgba(120,53,15,.12)' : 'rgba(20,83,45,.12)';

  const slaOk = r.slaMTTC <= r.slaMTTCTarget;

  // Precompute which sections are shown → ordinal numbers
  type SecId = 'exec' | 'risks' | 'assets' | 'ind' | 'eff' | 'sla' | 'act' | 'mat';
  const shownSections: SecId[] = [
    'exec',
    ...(effKPIs.length > 0 ? ['eff' as SecId] : []),
    'risks',
    ...(r.assets.length > 0 ? ['assets' as SecId] : []),
    'ind',
    ...(r.showSLA ? ['sla' as SecId] : []),
    'act',
    ...(r.showMaturity && r.maturityDomains.length > 0 ? ['mat' as SecId] : []),
  ];
  const secNum = (id: SecId) => shownSections.indexOf(id) + 1;

  // TOC items
  const toc = shownSections.map(id => {
    const map: Record<SecId, { title: string; rag: string }> = {
      exec:   { title: 'الملخص التنفيذي',             rag: finalScore >= 75 ? 'g' : finalScore >= 50 ? 'a' : 'r' },
      risks:  { title: 'المخاطر الرئيسية',             rag: critRisks === 0 ? 'g' : critRisks <= 2 ? 'a' : 'r' },
      assets: { title: 'الأصول الحيوية',               rag: avgProt >= 70 ? 'g' : avgProt >= 50 ? 'a' : 'r' },
      ind:    { title: 'مؤشرات الأداء',               rag: r.kpiCompliance >= 75 ? 'g' : r.kpiCompliance >= 55 ? 'a' : 'r' },
      eff:    { title: 'الكفاءة التشغيلية',            rag: 'a' },
      sla:    { title: 'مقاييس الاستجابة',             rag: slaOk ? 'g' : 'r' },
      act:    { title: 'التوصيات والاعتمادات',         rag: r.recommendations.length > 0 ? 'g' : 'n' },
      mat:    { title: 'تقييم مستوى الامتثال',         rag: parseFloat(avgMat) >= 80 ? 'g' : parseFloat(avgMat) >= 60 ? 'a' : 'r' },
    };
    return { ...map[id], num: secNum(id) };
  });

  // Section header helper
  const SH = (id: SecId, title: string, rag?: string) => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
      <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: '#94a3b8', minWidth: 28 }}>{String(secNum(id)).padStart(2, '0')}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', flex: 1, letterSpacing: -0.3 }}>{title}</span>
      {rag && (
        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 9, fontWeight: 800, letterSpacing: 0.5, padding: '3px 10px', borderRadius: 2, background: ragBg(rag), color: ragColor(rag), border: `1px solid ${ragBorder(rag)}` }}>
          {ragLabel(rag)}
        </span>
      )}
    </div>
  );

  return (
    <div className="max-w-[820px] mx-auto bg-white shadow-lg" dir="rtl">
      {/* ═══════ COVER PAGE ═══════ */}
      <div id="search-preview-section-general" className="report-cover" style={{ background: 'linear-gradient(160deg,#f8fdf5 0%,#f0f8ed 35%,#fdf8ec 70%,#fffcf0 100%)', color: '#1a3a1f', height: '1123px', maxHeight: '1123px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', border: '1px solid #c8dfc0', pageBreakAfter: 'always', boxSizing: 'border-box', margin: 0, padding: 0 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 15% 80%,rgba(26,92,46,.06) 0%,transparent 50%),radial-gradient(circle at 85% 20%,rgba(201,162,39,.07) 0%,transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 6, height: '100%', background: 'linear-gradient(180deg,#1a5c2e 0%,#c9a227 55%,rgba(201,162,39,.15) 100%)' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(26,92,46,.04)', top: -80, left: -80, pointerEvents: 'none', zIndex: 1 }} />
        <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(201,162,39,.05)', bottom: 80, right: -50, pointerEvents: 'none', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 2, padding: '24px 40px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            {r.logoBase64 ? <img src={r.logoBase64} alt="شعار" style={{ maxHeight: 40, maxWidth: 140, objectFit: 'contain' }} /> : <div style={{ fontSize: 9, color: '#1a5c2e', border: '1px solid rgba(26,92,46,.25)', padding: '4px 10px', borderRadius: 6, letterSpacing: 0.5, background: 'rgba(255,255,255,.8)', fontWeight: 600 }}>{r.orgName}</div>}
          </div>
          <div style={{ border: '1px solid rgba(26,92,46,.3)', borderRadius: 20, padding: '3px 10px', fontSize: 7, fontWeight: 800, letterSpacing: 1.5, color: '#1a5c2e', background: 'rgba(26,92,46,.06)' }}>{r.classification}</div>
        </div>
        <div style={{ height: '920px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '12px 50px 10px', boxSizing: 'border-box', overflow: 'hidden' }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 4, color: '#1a5c2e', opacity: 0.75, textTransform: 'uppercase', marginBottom: 12 }}>Information Security Report</div>
          <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15, letterSpacing: -1.5, marginBottom: 4, color: '#1a3a1f' }}>تقرير أمن المعلومات<br /><span style={{ color: '#c9a227' }}>{r.period}</span></div>
          <div style={{ fontSize: 11, color: '#5a7a5e', marginBottom: 20, letterSpacing: 0.5 }}>{dateF}</div>
          <div style={{ width: 180, height: 1.2, background: 'linear-gradient(90deg,transparent,#c9a227,rgba(26,92,46,.4),transparent)', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 9, color: '#5a7a5e', marginBottom: 3 }}>مُعدّ ومقدَّم إلى</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1a3a1f', marginBottom: 2 }}>{r.recipientName}</div>
          <div style={{ fontSize: 10, color: '#5a7a5e' }}>{r.orgName}</div>
          {r.subject && (
            <div style={{ marginTop: 22, width: '100%', maxWidth: 540, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', position: 'relative', borderRadius: 18, padding: '12px 16px 14px', background: 'linear-gradient(135deg,rgba(255,255,255,.8),rgba(240,248,237,.92))', border: '1px solid rgba(26,92,46,.2)', boxShadow: '0 10px 28px rgba(26,92,46,.08), inset 0 1px 0 rgba(255,255,255,.55)' }}>
                <div style={{ fontSize: 8, letterSpacing: 2, color: '#6b8f71', textTransform: 'uppercase', marginBottom: 7 }}>الموضوع</div>
                <div style={{ width: 120, height: 1.5, margin: '0 auto 8px', background: 'linear-gradient(90deg,transparent,rgba(201,162,39,.9),transparent)' }} />
                <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.95, color: '#1a3a1f', background: 'rgba(255,255,255,.55)', border: '1px solid rgba(26,92,46,.12)', borderRadius: 12, padding: '9px 13px' }}>
                  {r.subject}
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{ position: 'absolute', zIndex: 2, left: '40px', right: '40px', bottom: '12px', borderTop: '1px solid rgba(26,92,46,.12)', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,.6)', pageBreakInside: 'avoid' }}>
          <div style={{ fontSize: 9, color: '#5a7a5e', lineHeight: 1.6 }}>مقدَّم من<br /><strong style={{ color: '#1a3a1f', fontSize: '10px' }}>{r.author}</strong></div>
          <div style={{ fontSize: 8, color: '#8aaa8e', fontFamily: 'monospace' }}>v{r.version} · {dateF}</div>
        </div>
      </div>
      {/* ═══════ CISO NOTE ═══════ */}
      {r.chairNote && (
        <div style={{ background: 'linear-gradient(135deg,#f4faf0,#fdf8ec)', borderBottom: '1px solid #d4e8cc', padding: '18px 44px', pageBreakBefore: 'avoid', pageBreakAfter: 'avoid' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 32, height: 32, background: '#1a5c2e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0, marginTop: 2 }}>C</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8, letterSpacing: 2, color: '#8aaa8e', textTransform: 'uppercase', marginBottom: 5 }}>ملاحظة CISO — ما الجديد مقارنةً بالتقرير السابق</div>
              <div style={{ fontSize: 12, color: '#2d4a31', lineHeight: 2 }}>{r.chairNote}</div>
              <div style={{ fontSize: 9, color: '#8aaa8e', marginTop: 5 }}>{r.author} · {dateF}</div>
            </div>
          </div>
        </div>
      )}

{/* ═══════ TOC ═══════ */}

      <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '24px 44px', minHeight: '100vh', display: 'flex', flexDirection: 'column', pageBreakBefore: 'always', pageBreakAfter: 'always' }}>

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase' }}>فهرس التقرير — الحالة الراهنة</div>

        <div style={{ flex: 1, overflow: 'auto' }}>
        <table className="w-full border-collapse text-[10px]">

          <tbody>

            {toc.map((s, i) => (

              <tr key={i} style={{ background: i % 2 === 1 ? '#fff' : 'transparent' }}>

                <td style={{ padding: '7px 12px', borderBottom: '1px solid #e2e8f0', fontFamily: 'monospace', fontWeight: 700, color: '#94a3b8' }}>{String(s.num).padStart(2, '0')}</td>

                <td style={{ padding: '7px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, flex: 1 }}>{s.title}</td>

                <td style={{ padding: '7px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>

                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: ragColor(s.rag) }} />

                </td>

                <td style={{ padding: '7px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 9, fontWeight: 700, color: ragColor(s.rag) }}>{ragLabel(s.rag)}</td>

              </tr>

            ))}

          </tbody>

        </table>
        </div>

        <div style={{ display: 'flex', gap: 20, marginTop: 'auto', fontSize: 9, color: '#94a3b8', paddingTop: 16 }}>

          <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#dc2626', marginRight: 4 }} /> يستوجب تدخلاً فورياً</span>

          <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', marginRight: 4 }} /> يستوجب متابعة</span>

          <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e', marginRight: 4 }} /> وضع جيد</span>

        </div>

      </div>






      

      {/* ═══════ EXEC SUMMARY ═══════ */}
      <div id="search-preview-section-executive" className="px-11 py-7 border-b border-gray-100">
        {SH('exec', 'الملخص التنفيذي', finalScore >= 75 ? 'g' : finalScore >= 50 ? 'a' : 'r')}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, marginBottom: 18, alignItems: 'start' }}>
          <div style={{ background: '#1e293b', color: '#fff', borderRadius: 4, padding: '18px 22px', textAlign: 'center', minWidth: 110 }}>
            <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: -2, color: scoreColor(finalScore) }}>{finalScore}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>/ 100</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', marginTop: 7, paddingTop: 7, borderTop: '1px solid rgba(255,255,255,.1)' }}>{finalScore >= 75 ? 'وضع جيد' : finalScore >= 50 ? 'يستوجب الانتباه' : 'خطر مرتفع'}</div>
            {typeof r.scorePercentile === 'number' && (
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.65)', marginTop: 6 }}>
                {getPercentileText(r.scorePercentile)}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              {([
                { label: 'حوادث حرجة', val: r.kpiCritical, prev: r.prevCritical, color: '#dc2626', lower: true },
                { label: 'ثغرات مكتشفة', val: r.kpiVuln, prev: r.prevVuln, color: '#d97706', lower: true },
                { label: 'إجمالي الحوادث', val: r.kpiTotal, prev: r.prevTotal, color: '#1e293b', lower: true },
                { label: 'امتثال ISO', val: r.kpiCompliance, prev: r.prevCompliance, color: '#2563eb', lower: false, suffix: '%' },
              ] as Array<{ label: string; val: number; prev: number; color: string; lower: boolean; suffix?: string }>).map((kpi) => {
                const info = getDeltaInfo(kpi.val, kpi.prev, kpi.lower);
                const isGood = info.colorClass.includes('success');
                const isBad = info.colorClass.includes('danger');
                return (
                  <div key={kpi.label} style={{ background: '#fff', padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, marginBottom: 2, color: kpi.color }}>{kpi.val}{kpi.suffix ?? ''}</div>
                    <div style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600, marginBottom: 3 }}>{kpi.label}</div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 2, background: isGood ? '#f0fdf4' : isBad ? '#fef2f2' : '#f1f5f9', color: isGood ? '#16a34a' : isBad ? '#dc2626' : '#94a3b8' }}>{info.arrow} {info.label}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 2, fontSize: 10, fontWeight: 700, background: trendUp ? '#f0fdf4' : trendDown ? '#fef2f2' : '#f1f5f9', color: trendUp ? '#16a34a' : trendDown ? '#dc2626' : '#94a3b8' }}>{trendUp ? '↑' : trendDown ? '↓' : '→'} {r.trend}</span>
              <span style={{ fontSize: 11, color: '#475569', lineHeight: 1.9, flex: 1 }}>{r.summary}</span>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 9, fontWeight: 800, color: '#1e293b' }}>
                معادلة الحساب التلقائي للدرجة العالمية
              </div>
              <div style={{ padding: '10px 12px', fontSize: 9, color: '#475569', lineHeight: 1.9 }}>
                <div style={{ marginBottom: 6 }}>{scoreBreakdown.equation}</div>
                <div>Compliance = {componentScores.compliance}/100 × 0.25 = {weightedContributions.compliance}</div>
                <div>Maturity = {componentScores.maturity}/100 × 0.20 = {weightedContributions.maturity}</div>
                <div>AssetProtection = {componentScores.assetProtection}/100 × 0.15 = {weightedContributions.assetProtection}</div>
                <div>RiskPosture = {componentScores.riskPosture}/100 × 0.25 = {weightedContributions.riskPosture} (deduction: {riskPostureDetails.totalDeduction}, open: {riskPostureDetails.openRisks}, in-progress: {riskPostureDetails.inProgressRisks}, closed: {riskPostureDetails.closedRisks})</div>
                <div>Operational = {componentScores.operational}/100 × 0.15 = {weightedContributions.operational} (KPI: {operationalDetails.kpiAchievement}%, SLA: {operationalDetails.slaCompliance}%)</div>
                <div style={{ marginTop: 6, fontWeight: 800, color: '#1e293b' }}>SPI = round({scoreBreakdown.rawScore}) = {scoreBreakdown.finalScore}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ EFFICIENCY ═══════ */}
      {effKPIs.length > 0 && (
        <div id="search-preview-section-efficiency" className="px-11 py-7 border-b border-gray-100">
          {SH('eff', 'الكفاءة التشغيلية', 'a')}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, effKPIs.length)},1fr)`, gap: 1, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            {effKPIs.map((e) => {
              const good = e.lowerBetter ? e.val <= e.target : e.val >= e.target;
              const pct = Math.min(100, Math.round(Math.abs(e.val) / Math.max(e.target, 1) * 100));
              const mc = good ? '#16a34a' : '#dc2626';
              return (
                <div id={`search-preview-efficiency-${e.id}`} key={e.id} style={{ background: '#fff', padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>{e.title}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 8px', borderRadius: 2, background: good ? '#f0fdf4' : '#fef2f2', color: mc }}>{good ? 'ضمن الهدف' : 'دون الهدف'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, fontFamily: 'monospace', color: mc }}>{e.val}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{e.unit}</span>
                  </div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 6 }}>الهدف: {e.target}{e.unit}</div>
                  <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: mc }} /></div>
                  {e.description && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 6, lineHeight: 1.7 }}>{e.description}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════ RISKS ═══════ */}
      <div id="search-preview-section-risks" className="px-11 py-7 border-b border-gray-100" style={{ pageBreakBefore: 'always', pageBreakAfter: 'always' }}>
        {SH('risks', 'المخاطر الرئيسية', critRisks === 0 ? 'g' : critRisks <= 2 ? 'a' : 'r')}
        {critRisks > 0 && (
          <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.9, padding: '9px 13px', background: '#eff6ff', borderRight: '3px solid #2563eb', marginBottom: 14, borderRadius: '0 3px 3px 0' }}>
            {critRisks} مخاطر بدرجة 15 أو أعلى — تهديد مباشر لاستمرارية الأعمال يستوجب المعالجة قبل نهاية الربع.
          </div>
        )}
        <table className="w-full border-collapse text-[11px] mb-4">
          <thead>
            <tr>{['#', 'وصف المخاطرة والنظام المتأثر', 'الخطورة', 'الحالة', 'الدرجة', 'السيناريو الأسوأ', 'الضوابط المطلوبة', 'الاصول الحيوية المتاثرة'].map(h => (
              <th key={h} style={{ background: '#1e293b', color: '#fff', padding: '9px 12px', textAlign: 'right', fontWeight: 600, fontSize: 9, letterSpacing: 0.5 }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {sortedRisks.map((risk, i) => {
              const score = risk.probability * risk.impact;
              const sev = SEVERITY_MAP[risk.severity];
              const st = STATUS_MAP[risk.status];
              const autoWC = score >= 20 ? 'توقف العمليات 48+ ساعة وخسائر مالية مباشرة' : score >= 15 ? 'اختراق بيانات وتبعات قانونية' : score >= 10 ? 'تعطل جزئي يؤثر على الإنتاجية' : 'تأثير محدود يمكن احتواؤه';
              return (
                <tr id={`search-preview-risk-${risk.id}`} key={risk.id} style={{ background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 9, fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><div style={{ fontWeight: 600, marginBottom: 3 }}>{risk.description}</div><div style={{ fontSize: 9, color: '#94a3b8' }}>{risk.system}</div></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${sev?.bgClass}`}>{sev?.label}</span></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${st?.bgClass}`}>{st?.label}</span></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 3, fontSize: 10, fontWeight: 900, fontFamily: 'monospace', background: score >= 20 ? '#450a0a' : score >= 15 ? '#fef2f2' : score >= 10 ? '#fffbeb' : '#f0fdf4', color: score >= 20 ? '#fff' : score >= 15 ? '#dc2626' : score >= 10 ? '#d97706' : '#16a34a' }}>{score}</span>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 10, color: score >= 15 ? '#dc2626' : score >= 10 ? '#d97706' : '#94a3b8', fontWeight: score >= 15 ? 700 : 400, lineHeight: 1.8 }}>{risk.worstCase || autoWC}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 10, color: '#475569', lineHeight: 1.8 }}>{risk.requiredControls || '–'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 10, color: '#475569', lineHeight: 1.8 }}>{risk.affectedAssets || '–'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
     {/* ═══════ INDICATORS (KPIs + Benchmark) ═══════ */}
      <div id="search-preview-section-kpi" className="px-11 py-7 border-b border-gray-100">
        {SH('ind', 'مؤشرات الأداء', r.kpiCompliance >= 75 ? 'g' : r.kpiCompliance >= 55 ? 'a' : 'r')}
        <table className="w-full border-collapse text-[11px] mb-3">
          <thead>
            <tr>{['المؤشر', 'الفترة السابقة', 'الفترة الحالية', 'التغيير'].map(h => (
              <th key={h} style={{ background: '#1e293b', color: '#fff', padding: '9px 12px', textAlign: 'right', fontWeight: 600, fontSize: 9, letterSpacing: 0.5 }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            <tr><td colSpan={4} style={{ background: '#f8fafc', fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, padding: '6px 12px' }}>مؤشرات الحوادث والامتثال</td></tr>
            {([
              { label: 'الحوادث الحرجة', prev: r.prevCritical, cur: r.kpiCritical, lower: true, bm: false },
              { label: 'الثغرات المكتشفة', prev: r.prevVuln, cur: r.kpiVuln, lower: true, bm: false },
              { label: 'إجمالي الحوادث', prev: r.prevTotal, cur: r.kpiTotal, lower: true, bm: false },
              { label: 'امتثال ISO 27001', prevStr: `${r.prevCompliance}%`, curStr: `${r.kpiCompliance}%`, prev: r.prevCompliance, cur: r.kpiCompliance, lower: false, bm: r.bmCompliance > 0, bmStr: `${r.bmCompliance}%`, bmOk: r.kpiCompliance >= r.bmCompliance },
            ] as Array<{ label: string; prev: number; cur: number; lower: boolean; bm: boolean; prevStr?: string; curStr?: string; bmStr?: string; bmOk?: boolean }>).map((row, i) => {
              const info = getDeltaInfo(row.cur, row.prev, row.lower);
              const g = info.colorClass.includes('success'); const b = info.colorClass.includes('danger');
              return (
                <tr key={row.label} style={{ background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>{row.label}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontFamily: 'monospace' }}>{row.prevStr ?? row.prev}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontFamily: 'monospace' }}>{row.curStr ?? row.cur}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 2, background: g ? '#f0fdf4' : b ? '#fef2f2' : '#f1f5f9', color: g ? '#16a34a' : b ? '#dc2626' : '#94a3b8' }}>{info.arrow} {info.label}</span></td>
                </tr>
              );
            })}
            <tr><td colSpan={4} style={{ background: '#f8fafc', fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, padding: '6px 12px' }}>مقاييس الاستجابة</td></tr>
            {([
              { label: 'وقت الاحتواء MTTC (ساعة)', cur: r.slaMTTC, bm: false },
            ] as Array<{ label: string; cur: number; bm: boolean }>).map((row, i) => (
              <tr key={row.label} style={{ background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>{row.label}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#94a3b8' }}>—</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontFamily: 'monospace' }}>{row.cur}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>—</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* KPI Combo Chart */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ background: '#f8fafc', padding: '9px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#1e293b' }}>مقارنة المؤشرات — الفترة الحالية vs السابقة</span>
            <div style={{ display: 'flex', gap: 14 }}>
              {([['#cbd5e1', 'الفترة السابقة'], ['#1e3a5f', 'الفترة الحالية']] as [string, string][]).map(([col, lbl]) => (
                <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: '#94a3b8' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: col, display: 'inline-block' }} />{lbl}</span>
              ))}
            </div>
          </div>
          <div style={{ padding: '16px 20px', background: '#fff' }}>
            <canvas ref={kpiChartRef} width={680} height={200} style={{ width: '100%', display: 'block' }} />
          </div>
        </div>

        {/* Vuln + Incidents mini-block */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ background: '#fff', padding: '14px 16px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 }}>توزيع الثغرات</div>
            {([['حرجة', r.vulnCritical, '#dc2626'], ['عالية', r.vulnHigh, '#d97706'], ['متوسطة', r.vulnMedium, '#ca8a04'], ['منخفضة', r.vulnLow, '#16a34a']] as [string, number, string][]).map(([lbl, val, col]) => (
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <div style={{ fontSize: 10, minWidth: 50, color: '#475569' }}>{lbl}</div>
                <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${Math.round(val / totalVuln * 100)}%`, height: '100%', borderRadius: 2, background: col }} /></div>
                <div style={{ fontSize: 10, fontWeight: 700, minWidth: 20, fontFamily: 'monospace' }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', padding: '14px 16px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 }}>حالة الحوادث</div>
            {([['مفتوحة', r.incOpen, '#dc2626'], ['قيد المعالجة', r.incProgress, '#d97706'], ['مغلقة', r.incClosed, '#16a34a'], ...(r.incWatch > 0 ? [['مراقبة', r.incWatch, '#2563eb']] : [])] as [string, number, string][]).map(([lbl, val, col]) => (
              <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #e2e8f0', fontSize: 10 }}>
                <span style={{ color: '#475569' }}>{lbl}</span>
                <span style={{ fontWeight: 800, fontFamily: 'monospace', color: col }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* ═══════ ACTIONS (Recs + Challenges merged) ═══════ */}
      <div id="search-preview-section-actions" className="px-11 py-7 border-b border-gray-100">
        {SH('act', 'التوصيات والاعتمادات', r.recommendations.length > 0 ? 'g' : 'n')}
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>{['#', 'التوصية / الاعتماد', 'الأولوية / النوع', 'صاحب القرار'].map(h => (
              <th key={h} style={{ background: '#1e293b', color: '#fff', padding: '9px 12px', textAlign: 'right', fontWeight: 600, fontSize: 9, letterSpacing: 0.5 }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {r.recommendations.length > 0 && (
              <tr><td colSpan={4} style={{ background: '#f8fafc', fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, padding: '6px 12px' }}>توصيات تشغيلية</td></tr>
            )}
            {r.recommendations.map((rec, i) => {
              const pri = PRIORITY_MAP[rec.priority];
              return (
                <tr id={`search-preview-recommendation-${rec.id}`} key={rec.id} style={{ background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 9, fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3 }}>{rec.title}</div><div style={{ fontSize: 10, color: '#475569', lineHeight: 1.8 }}>{rec.description}</div></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${pri?.bgClass}`}>{pri?.label}</span></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>{rec.owner ? <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 2, background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>{rec.owner}</span> : '—'}</td>
                </tr>
              );
            })}
            {r.challenges.length > 0 && (
              <tr><td colSpan={4} style={{ background: '#fffbeb', fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, padding: '6px 12px' }}>اعتمادات استراتيجية تستوجب قراراً من الإدارة</td></tr>
            )}
            {r.challenges.map((chal, i) => {
              const ct = CHALLENGE_TYPES[chal.type] || CHALLENGE_TYPES.tech;
              return (
                <tr id={`search-preview-challenge-${chal.id}`} key={chal.id} style={{ background: '#fffbeb' }}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 9, fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace' }}>{String.fromCharCode(65 + i)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3 }}>{chal.title}</div><div style={{ fontSize: 10, color: '#475569', lineHeight: 1.8 }}>{chal.rootCause}</div></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${ct.bgClass}`}>{ct.label}</span></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 10, color: '#2563eb', fontWeight: 700 }}>{chal.requirement}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══════ MATURITY ═══════ */}
      {r.showMaturity && r.maturityDomains.length > 0 && (
        <div id="search-preview-section-maturity" className="px-11 py-7 border-b border-gray-100" style={{ background: '#f8fafc' }}>
          {SH('mat', 'تقييم مستوى الامتثال — ملحق تقييمي', parseFloat(avgMat) >= 80 ? 'g' : parseFloat(avgMat) >= 60 ? 'a' : 'r')}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14, padding: '12px 16px', background: '#fff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>متوسط الامتثال</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', fontFamily: 'monospace' }}>{avgMat}<span style={{ fontSize: 12, color: '#94a3b8' }}> %</span></div>
            </div>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>{parseFloat(avgMat) >= 85 ? 'امتثال ممتاز' : parseFloat(avgMat) >= 70 ? 'امتثال جيد' : parseFloat(avgMat) >= 50 ? 'امتثال متوسط' : 'يحتاج تحسيناً'}</span>
          </div>
          <div style={{ background: '#fff', borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 14 }}>
            {r.maturityDomains.map((domain) => (
              <div id={`search-preview-maturity-${domain.id}`} key={domain.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, flex: 1 }}>{domain.name}</div>
                <div style={{ width: 180, height: 6, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${domain.score}%`, height: '100%', borderRadius: 2, background: domain.score >= 85 ? '#15803d' : domain.score >= 70 ? '#16a34a' : domain.score >= 50 ? '#d97706' : '#dc2626' }} /></div>
                <div style={{ fontSize: 10, fontWeight: 700, minWidth: 86, color: '#475569', fontFamily: 'monospace' }}>{domain.score}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ FOOTER ═══════ */}
      <div style={{ background: '#1e293b', color: 'rgba(255,255,255,.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 44px', fontSize: 9, flexWrap: 'wrap', gap: 6, fontFamily: 'monospace' }}>
        <span><strong style={{ color: 'rgba(255,255,255,.55)' }}>{r.classification}</strong> · للمستلم المحدد فقط</span>
        <span>{r.orgName} · {r.author}</span>
        <span>{dateF} · v{r.version}</span>
      </div>
    </div>
  );
}