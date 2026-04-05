'use client';

import { useMemo } from 'react';
import { FiCheck, FiChevronRight } from 'react-icons/fi';
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

  const activePhase = useMemo(
    () => ROADMAP_PHASES.find((phase) => phase.status === 'active') ?? ROADMAP_PHASES[0],
    [],
  );

  const successFactors = [
    {
      title: 'Management Commitment First',
      detail:
        'Without CEO/board mandate in writing, the ISMS will stall. Get budget, scope and policy sign-off before you start any implementation work.',
    },
    {
      title: 'Fix Scope Early',
      detail:
        'Scope creep is the #1 cause of failed certifications. Define precise ISMS boundaries on day one and refuse to expand without formal change control.',
    },
    {
      title: 'Engage CB Early',
      detail:
        'Certification bodies have different interpretations of the standard. Align with your chosen CB before finalising your SoA and evidence approach.',
    },
  ];

  const pitfalls = [
    {
      title: 'Treating It as an IT Project',
      detail:
        'ISO 27001 is a business management system. Legal, HR, Finance and Facilities all have roles. Involve all departments from day one.',
    },
    {
      title: 'Over-Engineering Documents',
      detail:
        'Auditors want evidence of operation, not lengthy documents. One-page procedures with proof of execution beat 50-page policies that gather dust.',
    },
    {
      title: 'Skipping Internal Audit',
      detail:
        'You must run at least one full internal audit cycle before Stage 2. Plan it 3+ months before your CB audit date. Use an objective auditor.',
    },
  ];

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'linear-gradient(130deg, rgba(59,130,246,0.14), rgba(12,20,36,0.88) 68%)',
          padding: '16px',
          display: 'grid',
          gap: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'grid', gap: '6px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Implementation Roadmap</h2>
            <p style={{ margin: 0, color: 'var(--isms-txt2)', fontSize: '13px' }}>
              6-phase structured guide to ISO 27001:2022 certification
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <StatusBadge variant='info'>Phase {activePhase?.id ?? '-'} Active</StatusBadge>
            <StatusBadge variant='success'>{stats.pct}% Complete</StatusBadge>
          </div>
        </div>

        <ProgressBar value={stats.pct} tone={stats.pct >= 70 ? 'green' : stats.pct >= 40 ? 'amber' : 'blue'} height={10} />

        <div style={{ display: 'flex', gap: '8px', color: 'var(--isms-txt2)', fontSize: '12px', flexWrap: 'wrap' }}>
          <span>Done: {stats.done}</span>
          <span>Active: {stats.active}</span>
          <span>Pending: {stats.pending}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
        {ROADMAP_PHASES.map((phase) => {
          const watermark = String(phase.id).padStart(2, '0');
          const itemIcon = phase.status === 'done' ? FiCheck : FiChevronRight;

          return (
            <div
              key={phase.id}
              style={{
                position: 'relative',
                border: phase.status === 'active' ? '1px solid rgba(59,130,246,0.7)' : '1px solid var(--isms-border)',
                borderRadius: '12px',
                background: 'var(--isms-surf)',
                padding: '14px',
                display: 'grid',
                gap: '10px',
                boxShadow:
                  phase.status === 'active'
                    ? '0 10px 32px rgba(59,130,246,0.2), inset 0 0 0 1px rgba(59,130,246,0.22)'
                    : 'none',
                overflow: 'hidden',
              }}
            >
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '12px',
                  fontSize: '44px',
                  fontWeight: 800,
                  lineHeight: 1,
                  color: 'rgba(148,163,184,0.18)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  letterSpacing: '-0.04em',
                }}
              >
                {watermark}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{phase.title}</div>
                  <div style={{ color: 'var(--isms-txt3)', fontFamily: '"Fira Code", monospace', fontSize: '11px', marginTop: '4px' }}>
                    {phase.weeks}
                  </div>
                </div>

                <StatusBadge variant={statusVariant(phase.status)}>
                  {phase.status === 'done' ? 'COMPLETE' : phase.status === 'active' ? 'ACTIVE' : 'PENDING'}
                </StatusBadge>
              </div>

              <ul
                style={{
                  margin: 0,
                  paddingInlineStart: 0,
                  listStyle: 'none',
                  display: 'grid',
                  gap: '7px',
                  color: 'var(--isms-txt2)',
                  fontSize: '13px',
                }}
              >
                {phase.items.map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    {itemIcon === FiCheck ? (
                      <FiCheck size={14} style={{ marginTop: '2px', color: 'var(--isms-green)', flex: '0 0 auto' }} />
                    ) : (
                      <FiChevronRight size={14} style={{ marginTop: '2px', color: 'var(--isms-blue)', flex: '0 0 auto' }} />
                    )}
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          padding: '16px',
          display: 'grid',
          gap: '12px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>CISO Guidance</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Critical Success Factors</h4>

            {successFactors.map((item) => (
              <div
                key={item.title}
                style={{
                  border: '1px solid rgba(59,130,246,0.45)',
                  borderRadius: '10px',
                  background: 'rgba(59,130,246,0.1)',
                  padding: '10px',
                  display: 'grid',
                  gap: '5px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--isms-txt2)', lineHeight: 1.45 }}>{item.detail}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Common Pitfalls</h4>

            {pitfalls.map((item) => (
              <div
                key={item.title}
                style={{
                  border: '1px solid rgba(239,68,68,0.45)',
                  borderRadius: '10px',
                  background: 'rgba(239,68,68,0.1)',
                  padding: '10px',
                  display: 'grid',
                  gap: '5px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--isms-txt2)', lineHeight: 1.45 }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
