'use client';

import { useTheme } from '@/components/theme/ThemeProvider';
import type { ThemeMode } from '@/lib/theme';

type ThemeOption = {
  mode: ThemeMode;
  label: string;
  icon: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  { mode: 'light', label: 'Light', icon: '☀️' },
  { mode: 'dark', label: 'Dark', icon: '🌙' },
  { mode: 'system', label: 'System', icon: '🖥️' },
];

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useTheme();

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-[color:var(--theme-switcher-border)] bg-[color:var(--theme-switcher-bg)] p-1 shadow-[var(--theme-switcher-shadow)] ${compact ? 'gap-0.5' : 'gap-1'}`}
      role='radiogroup'
      aria-label='Theme mode'
    >
      {THEME_OPTIONS.map((option) => {
        const active = mode === option.mode;

        return (
          <button
            key={option.mode}
            type='button'
            role='radio'
            aria-checked={active}
            aria-label={`Switch to ${option.label} mode`}
            onClick={() => setMode(option.mode)}
            className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all duration-150 cursor-pointer border border-transparent ${
              active
                ? 'bg-[color:var(--theme-switcher-active-bg)] text-[color:var(--theme-switcher-active-text)] shadow-[var(--theme-switcher-active-shadow)]'
                : 'text-[color:var(--theme-switcher-text)] hover:bg-[color:var(--theme-switcher-hover-bg)]'
            }`}
          >
            <span aria-hidden='true'>{option.icon}</span>
            {!compact && <span className='ml-1'>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
