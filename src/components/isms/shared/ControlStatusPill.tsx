import type { ControlStatus } from '@/types/isms';

const OPTIONS: Array<{ value: ControlStatus; label: string }> = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'implemented', label: 'Implemented' },
];

export default function ControlStatusPill({
  value,
  onChange,
}: {
  value: ControlStatus;
  onChange: (status: ControlStatus) => void;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: '4px',
        border: '1px solid var(--isms-border)',
        borderRadius: '999px',
        padding: '3px',
        background: 'var(--isms-bg3)',
      }}
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              border: 'none',
              cursor: 'pointer',
              borderRadius: '999px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 700,
              color: active ? 'var(--isms-txt)' : 'var(--isms-txt2)',
              background: active ? 'rgba(59,130,246,0.22)' : 'transparent',
              whiteSpace: 'nowrap',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}