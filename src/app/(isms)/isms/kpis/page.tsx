'use client';

import { useEffect, useMemo } from 'react';
import { useIsmsStore } from '@/store/ismsStore';
import { getKpiStatus } from '@/lib/isms/calculations';
import KpiCard from '@/components/isms/shared/KpiCard';
import StatusBadge from '@/components/isms/shared/StatusBadge';

function badge(status: ReturnType<typeof getKpiStatus>): 'success' | 'warning' | 'danger' {
  if (status === 'on-target') return 'success';
  if (status === 'below-target') return 'warning';
  return 'danger';
}

export default function KpisPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const kpis = useIsmsStore((state) => state.kpis);
  const loadAll = useIsmsStore((state) => state.loadAll);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const stats = useMemo(() => {
    const onTarget = kpis.filter((kpi) => getKpiStatus(kpi) === 'on-target').length;
    const below = kpis.filter((kpi) => getKpiStatus(kpi) === 'below-target').length;
    const critical = kpis.filter((kpi) => getKpiStatus(kpi) === 'critical').length;

    return { onTarget, below, critical };
  }, [kpis]);

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='On Target' value={stats.onTarget} hint='Current >= target' />
        <KpiCard label='Below Target' value={stats.below} hint='Current between 80% and 99%' />
        <KpiCard label='Critical' value={stats.critical} hint='Current below 80%' />
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--isms-txt3)', fontSize: '11px' }}>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>KPI</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Category</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Current</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Target</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Frequency</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {kpis.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                  No KPI metrics recorded.
                </td>
              </tr>
            ) : (
              kpis.map((kpi) => {
                const status = getKpiStatus(kpi);
                return (
                  <tr key={kpi.id}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{kpi.name || 'Unnamed KPI'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{kpi.category || '-'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>{kpi.current}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>{kpi.target}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{kpi.frequency}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                      <StatusBadge variant={badge(status)}>{status}</StatusBadge>
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
