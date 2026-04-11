type ProgressTone = 'blue' | 'green' | 'amber' | 'red';

const TONE_COLOR: Record<ProgressTone, string> = {
  blue: 'var(--isms-blue)',
  green: 'var(--isms-green)',
  amber: 'var(--isms-amber)',
  red: 'var(--isms-red)',
};

export default function ProgressBar({
  value,
  tone = 'blue',
  height = 8,
}: {
  value: number;
  tone?: ProgressTone;
  height?: number;
}) {
  const safe = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: 999,
        background: 'var(--isms-progress-track)',
        border: '1px solid var(--isms-progress-border)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${safe}%`,
          height: '100%',
          borderRadius: 999,
          background: TONE_COLOR[tone],
          transition: 'width 0.2s ease',
        }}
      />
    </div>
  );
}