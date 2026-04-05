'use client';

import { useMemo } from 'react';
import { ROADMAP_PHASES } from '@/lib/isms/constants';
import StatusBadge from '@/components/isms/shared/StatusBadge';
import ProgressBar from '@/components/isms/shared/ProgressBar';

function statusVariant(status: 'done' | 'active' | 'pending'): 'success' | 'info' | 'warning' {
  if (status === 'done') return 'success';
  if (status === 'active') return 'info';
  return 'warning';
}

export default function RoadmapPage() {
  const stats = useMemo(() => {
    const total = ROADMAP_PHASES.length;
    const done = ROADMAP_PHASES.filter((phase) => phase.status === 'done').length;
    const active = ROADMAP_PHASES.filter((phase) => phase.status === 'active').length;
    const pending = ROADMAP_PHASES.filter((phase) => phase.status === 'pending').length;

    return {
      done,
      active,
      pending,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }, []);

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          padding: '16px',
          display: 'grid',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Implementation Roadmap</h2>
          <StatusBadge variant='info'>{stats.pct}% Complete</StatusBadge>
        </div>

        <ProgressBar value={stats.pct} tone={stats.pct >= 70 ? 'green' : stats.pct >= 40 ? 'amber' : 'blue'} />

        <div style={{ display: 'flex', gap: '8px', color: 'var(--isms-txt2)', fontSize: '12px' }}>
          <span>Done: {stats.done}</span>
          <span>Active: {stats.active}</span>
          <span>Pending: {stats.pending}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        {ROADMAP_PHASES.map((phase) => {
          const progress = phase.status === 'done' ? 100 : phase.status === 'active' ? 55 : 0;

          return (
            <div
              key={phase.id}
              style={{
                border: '1px solid var(--isms-border)',
                borderRadius: '12px',
                background: 'var(--isms-surf)',
                padding: '14px',
                display: 'grid',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{phase.title}</div>
                  <div style={{ color: 'var(--isms-txt3)', fontFamily: '"Fira Code", monospace', fontSize: '11px', marginTop: '4px' }}>
                    {phase.weeks}
                  </div>
                </div>

                <StatusBadge variant={statusVariant(phase.status)}>{phase.status}</StatusBadge>
              </div>

              <ProgressBar
                value={progress}
                tone={phase.status === 'done' ? 'green' : phase.status === 'active' ? 'blue' : 'amber'}
              />

              <ul style={{ margin: 0, paddingInlineStart: '18px', display: 'grid', gap: '6px', color: 'var(--isms-txt2)', fontSize: '13px' }}>
                {phase.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
