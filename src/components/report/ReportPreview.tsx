'use client';

import { useRef, useEffect } from 'react';
import type { ReportData } from '@/types/report';
import {
  formatArabicDate,
  getDeltaInfo,
  SEVERITY_MAP,
  STATUS_MAP,
  PRIORITY_MAP,
  HEATMAP_COLORS,
  getHeatmapClass,
  PROBABILITY_LABELS,
  IMPACT_LABELS,
  CHALLENGE_TYPES,
} from '@/lib/constants';

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

  const scoreColor = (s: number) => s >= 75 ? '#16a34a' : s >= 50 ? '#d97706' : '#dc2626';
  const ragColor = (rag: string) => rag === 'r' ? '#dc2626' : rag === 'a' ? '#f59e0b' : rag === 'g' ? '#22c55e' : '#94a3b8';
  const ragLabel = (rag: string) => rag === 'r' ? 'يستوجب تدخلاً' : rag === 'a' ? 'يستوجب متابعة' : rag === 'g' ? 'وضع جيد' : '';
  const ragBg   = (rag: string) => rag === 'r' ? '#fef2f2' : rag === 'a' ? '#fffbeb' : rag === 'g' ? '#f0fdf4' : '#f8fafc';
  const ragBorder = (rag: string) => rag === 'r' ? 'rgba(220,38,38,.15)' : rag === 'a' ? 'rgba(120,53,15,.12)' : 'rgba(20,83,45,.12)';

  const slaOk = r.slaMTTD <= r.slaMTTDTarget && r.slaMTTR <= r.slaMTTRTarget && r.slaMTTC <= r.slaMTTCTarget;

  // Precompute which sections are shown → ordinal numbers
  type SecId = 'exec' | 'risks' | 'assets' | 'ind' | 'eff' | 'sla' | 'act' | 'mat';
  const shownSections: SecId[] = [
    'exec', 'risks',
    ...(r.assets.length > 0 ? ['assets' as SecId] : []),
    'ind',
    ...(effKPIs.length > 0 ? ['eff' as SecId] : []),
    ...(r.showSLA ? ['sla' as SecId] : []),
    'act',
    ...(r.showMaturity && r.maturityDomains.length > 0 ? ['mat' as SecId] : []),
  ];
  const secNum = (id: SecId) => shownSections.indexOf(id) + 1;

  // TOC items
  const toc = shownSections.map(id => {
    const map: Record<SecId, { title: string; rag: string }> = {
      exec:   { title: 'الملخص التنفيذي',             rag: r.securityScore >= 75 ? 'g' : r.securityScore >= 50 ? 'a' : 'r' },
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
    <div className="max-w-[820px] mx-auto bg-white shadow-lg" dir="rtl">
      {/* ═══════ COVER PAGE ═══════ */}
      {/* ═══════ COVER PAGE ═══════ */}
      <div style={{ background: 'linear-gradient(160deg,#f8fdf5 0%,#f0f8ed 35%,#fdf8ec 70%,#fffcf0 100%)', color: '#1a3a1f', minHeight: 520, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', border: '1px solid #c8dfc0' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 15% 80%,rgba(26,92,46,.06) 0%,transparent 50%),radial-gradient(circle at 85% 20%,rgba(201,162,39,.07) 0%,transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 6, height: '100%', background: 'linear-gradient(180deg,#1a5c2e 0%,#c9a227 55%,rgba(201,162,39,.15) 100%)' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(26,92,46,.04)', top: -80, left: -80, pointerEvents: 'none', zIndex: 1 }} />
        <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(201,162,39,.05)', bottom: 80, right: -50, pointerEvents: 'none', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 2, padding: '40px 52px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            {r.logoBase64 ? <img src={r.logoBase64} alt="شعار" style={{ maxHeight: 52, maxWidth: 160, objectFit: 'contain' }} /> : <div style={{ fontSize: 10, color: '#1a5c2e', border: '1px solid rgba(26,92,46,.25)', padding: '6px 14px', borderRadius: 6, letterSpacing: 0.5, background: 'rgba(255,255,255,.8)', fontWeight: 600 }}>{r.orgName}</div>}
          </div>
          <div style={{ border: '1px solid rgba(26,92,46,.3)', borderRadius: 20, padding: '4px 14px', fontSize: 8, fontWeight: 800, letterSpacing: 2, color: '#1a5c2e', background: 'rgba(26,92,46,.06)' }}>{r.classification}</div>
        </div>
        <div style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 80px 30px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 5, color: '#1a5c2e', opacity: 0.75, textTransform: 'uppercase', marginBottom: 18 }}>Information Security Report</div>
          <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.1, letterSpacing: -2, marginBottom: 6, color: '#1a3a1f' }}>تقرير أمن المعلومات<br /><span style={{ color: '#c9a227' }}>{r.period}</span></div>
          <div style={{ fontSize: 12, color: '#5a7a5e', marginBottom: 36, letterSpacing: 0.5 }}>{dateF}</div>
          <div style={{ width: 200, height: 1.5, background: 'linear-gradient(90deg,transparent,#c9a227,rgba(26,92,46,.4),transparent)', margin: '0 auto 28px' }} />
          <div style={{ fontSize: 10, color: '#5a7a5e', marginBottom: 5 }}>مُعدّ ومقدَّم إلى</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a3a1f', marginBottom: 4 }}>{r.recipientName}</div>
          <div style={{ fontSize: 11, color: '#5a7a5e' }}>{r.orgName}</div>
        </div>
        <div style={{ position: 'relative', zIndex: 2, borderTop: '1px solid rgba(26,92,46,.12)', padding: '14px 52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,.6)' }}>
          <div style={{ fontSize: 10, color: '#5a7a5e', lineHeight: 1.8 }}>مقدَّم من<br /><strong style={{ color: '#1a3a1f' }}>{r.author}</strong></div>
          <div style={{ fontSize: 9, color: '#8aaa8e', fontFamily: 'monospace' }}>v{r.version} · {dateF}</div>
        </div>
      </div>
      {/* ═══════ CISO NOTE ═══════ */}
      {r.chairNote && (
        <div style={{ background: 'linear-gradient(135deg,#f4faf0,#fdf8ec)', borderBottom: '1px solid #d4e8cc', padding: '18px 44px' }}>
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
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '18px 44px' }}>
        <div style={{ fontSize: 8, letterSpacing: 2.5, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>فهرس التقرير — الحالة الراهنة</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          {toc.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 8px', borderRadius: 3 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: '#94a3b8', minWidth: 22 }}>{String(item.num).padStart(2, '0')}</span>
              <span style={{ fontSize: 11, flex: 1, color: '#475569' }}>{item.title}</span>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: ragColor(item.rag), flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 700, minWidth: 80, color: ragColor(item.rag) }}>{ragLabel(item.rag)}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
          {([['#dc2626', 'يستوجب تدخلاً فورياً'], ['#f59e0b', 'يستوجب متابعة'], ['#22c55e', 'وضع جيد']] as [string, string][]).map(([col, lbl]) => (
            <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: '#94a3b8' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: col, display: 'inline-block' }} />{lbl}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════ EXEC SUMMARY ═══════ */}
      <div className="px-11 py-7 border-b border-gray-100">
        {SH('exec', 'الملخص التنفيذي', r.securityScore >= 75 ? 'g' : r.securityScore >= 50 ? 'a' : 'r')}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, marginBottom: 18, alignItems: 'start' }}>
          <div style={{ background: '#1e293b', color: '#fff', borderRadius: 4, padding: '18px 22px', textAlign: 'center', minWidth: 110 }}>
            <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: -2, color: scoreColor(r.securityScore) }}>{r.securityScore}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>/ 100</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', marginTop: 7, paddingTop: 7, borderTop: '1px solid rgba(255,255,255,.1)' }}>{r.securityScore >= 75 ? 'وضع جيد' : r.securityScore >= 50 ? 'يستوجب الانتباه' : 'خطر مرتفع'}</div>
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
          </div>
        </div>
        {r.decisions.length > 0 && (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ background: '#dc2626', color: '#fff', padding: '8px 14px', fontSize: 10, fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
              <span>الاعتمادات المطلوبة من الإدارة العليا</span>
              <span style={{ opacity: 0.6, fontWeight: 400 }}>{r.decisions.length} قرار معلّق</span>
            </div>
            {r.decisions.map((dec, i) => (
              <div key={dec.id} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 12, padding: '11px 14px', borderBottom: '1px solid #e2e8f0', alignItems: 'start' }}>
                <div style={{ width: 20, height: 20, background: '#dc2626', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 3 }}>{dec.title}</div>
                  <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.8 }}>{dec.description}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', minWidth: 120 }}>
                  {dec.owner && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 2, background: '#fef2f2', color: '#dc2626' }}>صاحب القرار: {dec.owner}</span>}
                  {dec.budget && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 2, background: '#eff6ff', color: '#2563eb' }}>{dec.budget}</span>}
                  {dec.timeline && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 2, background: '#f0fdf4', color: '#16a34a' }}>⏱ {dec.timeline}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════ RISKS ═══════ */}
      <div className="px-11 py-7 border-b border-gray-100">
        {SH('risks', 'المخاطر الرئيسية', critRisks === 0 ? 'g' : critRisks <= 2 ? 'a' : 'r')}
        {critRisks > 0 && (
          <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.9, padding: '9px 13px', background: '#eff6ff', borderRight: '3px solid #2563eb', marginBottom: 14, borderRadius: '0 3px 3px 0' }}>
            {critRisks} مخاطر بدرجة 15 أو أعلى — تهديد مباشر لاستمرارية الأعمال يستوجب المعالجة قبل نهاية الربع.
          </div>
        )}
        <table className="w-full border-collapse text-[11px] mb-4">
          <thead>
            <tr>{['#', 'وصف المخاطرة والنظام المتأثر', 'الخطورة', 'الحالة', 'الدرجة', 'السيناريو الأسوأ'].map(h => (
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
                <tr key={risk.id} style={{ background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 9, fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><div style={{ fontWeight: 600, marginBottom: 3 }}>{risk.description}</div><div style={{ fontSize: 9, color: '#94a3b8' }}>{risk.system}</div></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${sev?.bgClass}`}>{sev?.label}</span></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}><span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${st?.bgClass}`}>{st?.label}</span></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 3, fontSize: 10, fontWeight: 900, fontFamily: 'monospace', background: score >= 20 ? '#450a0a' : score >= 15 ? '#fef2f2' : score >= 10 ? '#fffbeb' : '#f0fdf4', color: score >= 20 ? '#fff' : score >= 15 ? '#dc2626' : score >= 10 ? '#d97706' : '#16a34a' }}>{score}</span>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 10, color: score >= 15 ? '#dc2626' : score >= 10 ? '#d97706' : '#94a3b8', fontWeight: score >= 15 ? 700 : 400, lineHeight: 1.8 }}>{risk.worstCase || autoWC}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>خريطة المخاطر الحرارية</div>
          <table className="border-collapse w-full text-[9px]">
            <thead>
              <tr>
                <th style={{ background: '#1e293b', color: '#fff', padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>الاحتمالية / التأثير</th>
                {IMPACT_LABELS.slice(1).map((label, i) => <th key={i} style={{ background: '#1e293b', color: '#fff', padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>{i + 1} – {label}</th>)}
              </tr>
            </thead>
            <tbody>
              {hmRows.map((row) => (
                <tr key={row.p}>
                  <td style={{ background: '#f8fafc', color: '#1e3a5f', fontWeight: 700, textAlign: 'right', padding: '6px 10px', whiteSpace: 'nowrap' }}>{PROBABILITY_LABELS[row.p]} ({row.p})</td>
                  {row.cells.map((cell, ci) => {
                    const colors = HEATMAP_COLORS[cell.cls];
                    return <td key={ci} className="p-1"><div style={{ background: colors?.bg, color: colors?.text, borderRadius: 4, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, gap: 2 }}>{cell.cnt > 0 && <span>{cell.cnt}▪</span>}<span>{cell.score}</span></div></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════ ASSETS ═══════ */}
      {r.assets.length > 0 && (
        <div className="px-11 py-7 border-b border-gray-100">
          {SH('assets', 'الأصول الحيوية', avgProt >= 70 ? 'g' : avgProt >= 50 ? 'a' : 'r')}
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>{['الأصل الحيوي', 'الأهمية التشغيلية', 'مستوى الحماية', 'التقييم', 'الثغرات الرئيسية'].map(h => (
                <th key={h} style={{ background: '#1e293b', color: '#fff', padding: '9px 12px', textAlign: 'right', fontWeight: 600, fontSize: 9, letterSpacing: 0.5 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {r.assets.map((asset, i) => {
                const pct = asset.protectionLevel;
                const barC = pct >= 60 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
                const badgeBg = pct >= 60 ? '#f0fdf4' : pct >= 40 ? '#fffbeb' : '#fef2f2';
                const badgeLbl = pct >= 80 ? 'ممتاز' : pct >= 60 ? 'جيد' : pct >= 40 ? 'يحتاج تعزيزاً' : 'ضعيف';
                return (
                  <tr key={asset.id} style={{ background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>{asset.name}</td>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 10, color: '#94a3b8' }}>{asset.value}</td>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid #e2e8f0', minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 2, background: barC, width: `${pct}%` }} /></div>
                        <span style={{ fontSize: 10, fontWeight: 800, minWidth: 32, fontFamily: 'monospace', color: barC }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid #e2e8f0' }}><span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 2, fontSize: 9, fontWeight: 700, background: badgeBg, color: barC }}>{badgeLbl}</span></td>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 10, color: '#94a3b8' }}>{asset.gaps || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════ INDICATORS (KPIs + Benchmark) ═══════ */}
      <div className="px-11 py-7 border-b border-gray-100">
        {SH('ind', 'مؤشرات الأداء', r.kpiCompliance >= 75 ? 'g' : r.kpiCompliance >= 55 ? 'a' : 'r')}
        <table className="w-full border-collapse text-[11px] mb-3">
          <thead>
            <tr>{['المؤشر', 'الفترة السابقة', 'الفترة الحالية', 'التغيير', 'مقارنة القطاع'].map(h => (
              <th key={h} style={{ background: '#1e293b', color: '#fff', padding: '9px 12px', textAlign: 'right', fontWeight: 600, fontSize: 9, letterSpacing: 0.5 }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            <tr><td colSpan={5} style={{ background: '#f8fafc', fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, padding: '6px 12px' }}>مؤشرات الحوادث والامتثال</td></tr>
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
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>{row.bm ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 2, fontSize: 9, fontWeight: 700, fontFamily: 'monospace', background: row.bmOk ? '#f0fdf4' : '#fef2f2', color: row.bmOk ? '#16a34a' : '#dc2626' }}>{row.bmStr}</span> : '—'}</td>
                </tr>
              );
            })}
            <tr><td colSpan={5} style={{ background: '#f8fafc', fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, padding: '6px 12px' }}>مقاييس الاستجابة</td></tr>
            {([
              { label: 'وقت الاكتشاف MTTD (ساعة)', cur: r.slaMTTD, bm: r.bmMTTD > 0, bmV: r.bmMTTD, bmOk: r.slaMTTD <= r.bmMTTD },
              { label: 'وقت الاستجابة MTTR (ساعة)', cur: r.slaMTTR, bm: r.bmMTTR > 0, bmV: r.bmMTTR, bmOk: r.slaMTTR <= r.bmMTTR },
              { label: 'درجة الأمن الكلية', cur: r.securityScore, bm: r.bmScore > 0, bmV: r.bmScore, bmOk: r.securityScore >= r.bmScore },
            ] as Array<{ label: string; cur: number; bm: boolean; bmV: number; bmOk: boolean }>).map((row, i) => (
              <tr key={row.label} style={{ background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>{row.label}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#94a3b8' }}>—</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontFamily: 'monospace' }}>{row.cur}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>—</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>{row.bm ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 2, fontSize: 9, fontWeight: 700, fontFamily: 'monospace', background: row.bmOk ? '#f0fdf4' : '#fef2f2', color: row.bmOk ? '#16a34a' : '#dc2626' }}>{row.bmV}</span> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {r.bmSector && <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 12, padding: '6px 10px', background: '#f8fafc', borderRadius: 2 }}>المرجع: {r.bmSector}</div>}

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

      {/* ═══════ EFFICIENCY ═══════ */}
      {effKPIs.length > 0 && (
        <div className="px-11 py-7 border-b border-gray-100">
          {SH('eff', 'الكفاءة التشغيلية', 'a')}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, effKPIs.length)},1fr)`, gap: 1, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            {effKPIs.map((e) => {
              const good = e.lowerBetter ? e.val <= e.target : e.val >= e.target;
              const pct = Math.min(100, Math.round(Math.abs(e.val) / Math.max(e.target, 1) * 100));
              const mc = good ? '#16a34a' : '#dc2626';
              return (
                <div key={e.id} style={{ background: '#fff', padding: '16px 18px' }}>
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

      {/* ═══════ SLA ═══════ */}
      {r.showSLA && (
        <div className="px-11 py-7 border-b border-gray-100">
          {SH('sla', 'مقاييس الاستجابة للحوادث', slaOk ? 'g' : 'r')}
          {!slaOk && <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.9, padding: '9px 13px', background: '#eff6ff', borderRight: '3px solid #2563eb', marginBottom: 14, borderRadius: '0 3px 3px 0' }}>مؤشرات الاستجابة تجاوزت الحد المقبول — التأخر يُطيل نافذة الهجوم ويُضاعف الأضرار.</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
            {([['MTTD', 'وقت الاكتشاف', r.slaMTTD, r.slaMTTDTarget], ['MTTR', 'وقت الاستجابة', r.slaMTTR, r.slaMTTRTarget], ['MTTC', 'وقت الاحتواء', r.slaMTTC, r.slaMTTCTarget]] as [string, string, number, number][]).map(([code, lbl, val, tgt]) => {
              const ok = val <= tgt;
              return (
                <div key={code} style={{ background: '#fff', padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 6, fontFamily: 'monospace' }}>{code}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, fontFamily: 'monospace', color: ok ? '#16a34a' : '#dc2626' }}>{val}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 3, marginBottom: 6 }}>ساعة — {lbl}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>الهدف ≤ {tgt} ساعة</div>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 2, fontSize: 8, fontWeight: 700, marginTop: 6, background: ok ? '#f0fdf4' : '#fef2f2', color: ok ? '#16a34a' : '#dc2626' }}>{ok ? 'ضمن الهدف' : 'تجاوز الهدف'}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ background: '#fff', padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: r.slaRate >= 80 ? '#16a34a' : '#dc2626' }}>{r.slaRate}%</div>
              <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 3 }}>محلولة ضمن SLA</div>
            </div>
            <div style={{ background: '#fff', padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: r.slaBreach === 0 ? '#16a34a' : '#dc2626' }}>{r.slaBreach}</div>
              <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 3 }}>تجاوزت الاتفاقية</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ACTIONS (Recs + Challenges merged) ═══════ */}
      <div className="px-11 py-7 border-b border-gray-100">
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
                <tr key={rec.id} style={{ background: i % 2 === 1 ? '#f8fafc' : '#fff' }}>
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
                <tr key={chal.id} style={{ background: '#fffbeb' }}>
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
        <div className="px-11 py-7 border-b border-gray-100" style={{ background: '#f8fafc' }}>
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
              <div key={domain.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderBottom: '1px solid #e2e8f0' }}>
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