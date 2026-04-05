'use client';

import { useEffect, useMemo } from 'react';
import { useIsmsStore } from '@/store/ismsStore';
import { computeComplianceStats, getKpiStatus, getRiskScore } from '@/lib/isms/calculations';
import KpiCard from '@/components/isms/shared/KpiCard';
import StatusBadge from '@/components/isms/shared/StatusBadge';

function badgeForKpi(status: ReturnType<typeof getKpiStatus>): 'success' | 'warning' | 'danger' {
  if (status === 'on-target') return 'success';
  if (status === 'below-target') return 'warning';
  return 'danger';
}

export default function BoardReportPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const risks = useIsmsStore((state) => state.risks);
  const kpis = useIsmsStore((state) => state.kpis);
  const loadAll = useIsmsStore((state) => state.loadAll);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const compliance = useMemo(
    () => computeComplianceStats(workspace?.clauseStatus ?? {}, workspace?.controlStatus ?? {}),
    [workspace],
  );

  const topRisks = useMemo(
    () =>
      [...risks]
        .sort((a, b) => getRiskScore(b.likelihood, b.impact) - getRiskScore(a.likelihood, a.impact))
        .slice(0, 3),
    [risks],
  );

  const kpiRows = useMemo(() => [...kpis].slice(0, 8), [kpis]);

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Board and Management Report</h2>
          <p style={{ margin: '8px 0 0', color: 'var(--isms-txt2)', fontSize: '13px' }}>
            Executive snapshot of ISMS posture, top risks, and KPI performance.
          </p>
        </div>

        <button
          type='button'
          onClick={() => window.print()}
          style={{
            border: '1px solid var(--isms-border)',
            borderRadius: '8px',
            background: 'var(--isms-bg2)',
            color: 'var(--isms-txt)',
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '12px',
          }}
        >
          Print or PDF
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='Organization' value={workspace?.orgName || 'Not Set'} hint={workspace?.industry || 'Industry not set'} />
        <KpiCard label='ISMS Scope' value={workspace?.scope || 'Not Set'} hint={workspace?.certBody || 'Certification body not set'} />
        <KpiCard label='Target Date' value={workspace?.targetDate || 'Not Set'} hint='Certification milestone' />
        <KpiCard label='Overall Compliance' value={`${compliance.overallPct}%`} hint='Clauses + Annex controls implemented' />
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          padding: '16px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Top 3 Risks</h3>

        <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
          {topRisks.length === 0 ? (
            <div style={{ color: 'var(--isms-txt2)', fontSize: '13px' }}>No risks recorded.</div>
          ) : (
            topRisks.map((risk) => {
              const score = getRiskScore(risk.likelihood, risk.impact);
              return (
                <div
                  key={risk.id}
                  style={{
                    border: '1px solid var(--isms-border)',
                    borderRadius: '8px',
                    background: 'var(--isms-bg3)',
                    padding: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{risk.title || 'Untitled risk'}</div>
                    <div style={{ marginTop: '4px', color: 'var(--isms-txt2)', fontSize: '12px' }}>
                      {risk.category || 'Uncategorized'} · Owner: {risk.owner || 'Unassigned'}
                    </div>
                  </div>
                  <StatusBadge variant={score >= 20 ? 'danger' : score >= 10 ? 'warning' : 'info'}>{`Score ${score}`}</StatusBadge>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          overflowX: 'auto',
        }}
      >
        <div style={{ padding: '16px 16px 8px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>KPI Performance</h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--isms-txt3)', fontSize: '11px' }}>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>KPI</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Category</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Current</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Target</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {kpiRows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                  No KPI metrics recorded.
                </td>
              </tr>
            ) : (
              kpiRows.map((kpi) => {
                const status = getKpiStatus(kpi);
                return (
                  <tr key={kpi.id}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{kpi.name || 'Unnamed KPI'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{kpi.category || '-'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>{kpi.current}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>{kpi.target}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                      <StatusBadge variant={badgeForKpi(status)}>{status}</StatusBadge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
