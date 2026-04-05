'use client';

import { useEffect, useMemo } from 'react';
import { useIsmsStore } from '@/store/ismsStore';
import KpiCard from '@/components/isms/shared/KpiCard';
import StatusBadge from '@/components/isms/shared/StatusBadge';

export default function AwarenessPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const awareness = useIsmsStore((state) => state.awareness);
  const loadAll = useIsmsStore((state) => state.loadAll);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const stats = useMemo(() => {
    const completed = awareness.filter((item) => item.status === 'Completed').length;
    const inProgress = awareness.filter((item) => item.status === 'In Progress').length;
    const avgCompletion =
      awareness.length > 0
        ? Math.round(awareness.reduce((sum, item) => sum + item.completionRate, 0) / awareness.length)
        : 0;

    return { completed, inProgress, avgCompletion };
  }, [awareness]);

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='Completed Sessions' value={stats.completed} hint='Status: completed' />
        <KpiCard label='In Progress Sessions' value={stats.inProgress} hint='Status: in progress' />
        <KpiCard label='Average Completion' value={`${stats.avgCompletion}%`} hint='Across all sessions' />
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
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Type</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Date</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Audience</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Completion</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {awareness.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                  No awareness sessions recorded.
                </td>
              </tr>
            ) : (
              awareness.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{item.title || 'Untitled session'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{item.type}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{item.sessionDate || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{item.audience || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>{item.completionRate}%</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={item.status === 'Completed' ? 'success' : 'warning'}>{item.status}</StatusBadge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
