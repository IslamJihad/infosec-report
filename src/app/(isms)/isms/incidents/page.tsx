'use client';

import { useEffect, useMemo } from 'react';
import { useIsmsStore } from '@/store/ismsStore';
import KpiCard from '@/components/isms/shared/KpiCard';
import StatusBadge from '@/components/isms/shared/StatusBadge';

export default function IncidentsPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const incidents = useIsmsStore((state) => state.incidents);
  const loadAll = useIsmsStore((state) => state.loadAll);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const stats = useMemo(() => {
    const open = incidents.filter((incident) => incident.status === 'Open').length;
    const critical = incidents.filter((incident) => incident.severity === 'Critical').length;

    return {
      total: incidents.length,
      open,
      critical,
    };
  }, [incidents]);

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='Total Incidents' value={stats.total} hint='All logged events' />
        <KpiCard label='Open Incidents' value={stats.open} hint='Require active handling' />
        <KpiCard label='Critical Incidents' value={stats.critical} hint='Highest severity' />
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
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Title</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Category</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Severity</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Detected</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                  No incidents recorded.
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr key={incident.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{incident.title || 'Untitled incident'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{incident.category || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={incident.severity === 'Critical' ? 'danger' : incident.severity === 'High' ? 'warning' : 'info'}>
                      {incident.severity}
                    </StatusBadge>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{incident.detectedAt || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{incident.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
