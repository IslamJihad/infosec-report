import type { ReactNode } from 'react';

export default function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--isms-border)',
        borderRadius: '12px',
        background: 'var(--isms-surf)',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontFamily: '"Fira Code", monospace',
          fontSize: '10px',
          color: 'var(--isms-txt3)',
          textTransform: 'uppercase',
          letterSpacing: '0.7px',
        }}
      >
        {label}
      </div>

      <div style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.15, marginTop: '8px', color: 'var(--isms-txt)' }}>
        {value}
      </div>

      {hint ? <div style={{ fontSize: '11px', color: 'var(--isms-txt2)', marginTop: '6px' }}>{hint}</div> : null}
    </div>
  );
}