import type { ReactNode } from 'react';

type StatusBadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const VARIANT_STYLES: Record<StatusBadgeVariant, { bg: string; border: string; color: string }> = {
  neutral: { bg: 'var(--isms-surf-soft)', border: 'var(--isms-border)', color: 'var(--isms-txt2)' },
  success: { bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.35)', color: 'var(--isms-green)' },
  warning: { bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.35)', color: 'var(--isms-amber)' },
  danger: { bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.35)', color: 'var(--isms-red)' },
  info: { bg: 'rgba(59,130,246,0.14)', border: 'rgba(59,130,246,0.35)', color: 'var(--isms-blue)' },
};

export default function StatusBadge({
  children,
  variant = 'neutral',
}: {
  children: ReactNode;
  variant?: StatusBadgeVariant;
}) {
  const style = VARIANT_STYLES[variant];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '999px',
        padding: '3px 8px',
        border: `1px solid ${style.border}`,
        background: style.bg,
        color: style.color,
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.25px',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
}