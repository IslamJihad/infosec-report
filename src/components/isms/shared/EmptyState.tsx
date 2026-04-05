import type { ReactNode } from 'react';

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--isms-border)',
        borderRadius: '12px',
        padding: '22px',
        background: 'var(--isms-surf)',
      }}
    >
      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--isms-txt)' }}>{title}</h2>
      <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--isms-txt2)' }}>{description}</p>
      {action ? <div style={{ marginTop: '14px' }}>{action}</div> : null}
    </div>
  );
}
